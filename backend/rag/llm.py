"""
llm.py
------
LangChain ChatGroq (LLaMA) configuration and LangGraph agentic workflow.
The agent can route between:
  1. FAISS vector-store retrieval (document knowledge)
  2. Tavily web search (external knowledge)
"""

import os
from typing import Annotated, TypedDict

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition

from rag.retrieval import retrieve_context, format_context_for_prompt

load_dotenv()

# ---------------------------------------------------------------------------
# LLM instance (Groq + LLaMA 3)
# ---------------------------------------------------------------------------
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    temperature=0.4,
    groq_api_key=os.getenv("GROQ_API_KEY"),
)

# ---------------------------------------------------------------------------
# Tools the agent can call
# ---------------------------------------------------------------------------

@tool
def search_documents(query: str) -> str:
    """Search the uploaded document knowledge base for information relevant to the query."""
    chunks = retrieve_context(query, k=5)
    if not chunks:
        return "No relevant information found in the uploaded documents."
    return format_context_for_prompt(chunks)


@tool
def search_web(query: str) -> str:
    """Search the web using Tavily for up-to-date or external information not found in documents."""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
        response = client.search(query, max_results=3)
        results = []
        for r in response.get("results", []):
            results.append(f"**{r['title']}**\n{r['content']}\nSource: {r['url']}")
        return "\n\n---\n\n".join(results) if results else "No web results found."
    except Exception as e:
        return f"Web search failed: {str(e)}"


tools = [search_documents, search_web]
llm_with_tools = llm.bind_tools(tools)

# ---------------------------------------------------------------------------
# LangGraph Agent State & Graph
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    messages: Annotated[list, add_messages]


def build_system_prompt(mode: str = "normal") -> str:
    """Return a system prompt tuned for the chosen intelligence mode."""
    base = (
        "You are BrainyDocs AI, an intelligent knowledge assistant. "
        "You help users understand, summarize, and reason across their uploaded documents. "
        "Always cite your sources using [Source N] notation when referencing document content. "
        "If the user's question cannot be answered from the documents, use the web search tool. "
        "Be thorough, accurate, and helpful."
    )
    if mode == "eli5":
        base += (
            "\n\nIMPORTANT: The user has enabled 'Explain Like I'm 5' mode. "
            "Simplify all explanations so a young child could understand. "
            "Use simple words, analogies, and short sentences."
        )
    elif mode == "deep":
        base += (
            "\n\nIMPORTANT: The user has enabled 'Deep Mode'. "
            "Provide exhaustive, multi-step reasoning. Cross-reference multiple sources. "
            "Include detailed analysis and external verification where possible."
        )
    return base


def agent_node(state: AgentState):
    """Invoke the LLM with tools bound."""
    response = llm_with_tools.invoke(state["messages"])
    return {"messages": [response]}


def build_agent_graph():
    """Construct and compile the LangGraph agent."""
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", ToolNode(tools))
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")
    return graph.compile()


# Pre-compile the graph once at module level
agent_graph = build_agent_graph()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

# In-memory chat history (keyed by session_id)
_chat_histories: dict[str, list] = {}


def chat(
    query: str,
    session_id: str = "default",
    mode: str = "normal",
) -> dict:
    """
    Run a user query through the agentic RAG pipeline.

    Returns a dict with:
      - answer: str
      - sources: list[dict]
    """
    # Build / retrieve message history
    if session_id not in _chat_histories:
        _chat_histories[session_id] = []

    history = _chat_histories[session_id]

    system_msg = SystemMessage(content=build_system_prompt(mode))
    user_msg = HumanMessage(content=query)

    messages = [system_msg] + history + [user_msg]

    # Invoke the agent
    result = agent_graph.invoke({"messages": messages})

    # Extract the final AI message
    ai_messages = [
        m for m in result["messages"]
        if isinstance(m, AIMessage) and not m.tool_calls
    ]
    answer = ai_messages[-1].content if ai_messages else "I could not generate a response."

    # Persist history (keep last 20 messages to bound memory)
    history.append(user_msg)
    history.append(AIMessage(content=answer))
    _chat_histories[session_id] = history[-20:]

    # Extract source citations from retrieved docs
    sources = retrieve_context(query, k=3)

    return {
        "answer": answer,
        "sources": sources,
    }
