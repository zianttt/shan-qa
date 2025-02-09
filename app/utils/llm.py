import os
from app.configs.configs import State
from langchain_openai import ChatOpenAI
from langchain_core.messages import (
    trim_messages,
    HumanMessage
)
from langchain_core.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder
)

from langgraph.graph import START, StateGraph
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory

from app.utils.token_utils import tiktoken_counter
from app.db import get_client

mongo_client = get_client()

class StatefulLLM:
    def __init__(self, session_id: str):
        self.model = ChatOpenAI(model="llama-3.3-70b-versatile",
                   api_key=os.getenv("GROQ_API_KEY"),
                   base_url=os.getenv("GROQ_BASE_URL"))
        
        # self.model = ChatOpenAI(model="deepseek-reasoner",
        #            api_key=os.getenv("DEEPSEEK_API_KEY"),
        #            base_url=os.getenv("DEEPSEEK_BASE_URL"))

        self._trimmer = trim_messages(
            max_tokens=1000,
            strategy="last",
            token_counter=tiktoken_counter,
            include_system=True,
            allow_partial=False,
            start_on="human",
            end_on=("human", "tool")
        )

        self._prompt_template = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a helpful teacher. You always answer questions accurately, and provide steps-by-steps explanation. You should always answer in English. You should strictly and always answer in well-formatted Markdown format. If there are any formula, you should use LaTeX to format them.",
                ),
                MessagesPlaceholder(variable_name="history"),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        self.session_id = session_id

        self.init_langchain_app()
        self.init_chain()

    def init_langchain_app(self):
        workflow = StateGraph(state_schema=State)
        workflow.add_edge(START, "model")
        workflow.add_node("model", self.call_model)
        memory = MemorySaver()
        self.langchain_app = workflow.compile(checkpointer=memory)
    
    def init_chain(self):
        chain = self._prompt_template | self.model

        self.chain = RunnableWithMessageHistory(
            chain,
            lambda session_id: MongoDBChatMessageHistory(
                connection_string=os.getenv("MONGO_URI"),
                session_id=session_id,
                database_name=os.getenv("MONGO_DB"),
                collection_name="chat_histories",
            ),
            input_messages_key="messages",
            history_messages_key="history",
        )

    async def call_model(self, state: State):
        trimmed_messages = self._trimmer.invoke(state["messages"])
        prompt = await self._prompt_template.ainvoke(
            {"messages": trimmed_messages}
        )
        response = await self.model.ainvoke(prompt)
        return {"messages": response}

    async def query_llm(self, query: str):
        input_messages = [HumanMessage(query)]
        response = await self.chain.ainvoke(
            {"messages": input_messages},
            {"configurable": {"session_id": self.session_id}},
        )
        return response