from typing import Sequence
from typing_extensions import Annotated, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class State(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]

class Configurable(TypedDict):
    thread_id: str

class Config(TypedDict):
    configurable: Configurable