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
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, AIMessageChunk, ToolMessage
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

# In-memory chat history removed

import json

def chat_stream(
    query: str,
    history_messages: list,
    mode: str = "normal",
):
    system_msg = SystemMessage(content=build_system_prompt(mode))
    user_msg = HumanMessage(content=query)
    
    messages = [system_msg] + history_messages + [user_msg]

    # Pre-fetch sources since tools might take a while, send them immediately
    sources = retrieve_context(query, k=3)
    formatted_sources = [{"id": i, "content": "", "metadata": s["metadata"]} for i, s in enumerate(sources)]
    yield f"data: {json.dumps({'type': 'sources', 'data': formatted_sources})}\n\n"

    # Stream agent execution
    full_answer = ""
    for chunk, metadata in agent_graph.stream({"messages": messages}, stream_mode="messages"):
        if isinstance(chunk, AIMessageChunk) and chunk.content:
            full_answer += chunk.content
            yield f"data: {json.dumps({'type': 'chunk', 'data': chunk.content})}\n\n"
    
    # Return the final full text at the end for DB saving purposes
    yield f"data: {json.dumps({'type': 'done', 'final_answer': full_answer})}\n\n"
