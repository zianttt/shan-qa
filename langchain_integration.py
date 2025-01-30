import os
from typing import List
from configs import State
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



from configs import Config
from utils import tiktoken_counter


class StatefulLLM:
    def __init__(self):
        self.model = ChatOpenAI(model="deepseek-r1-distill-llama-70b",
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
                    "You are a helpful Math teacher",
                ),
                MessagesPlaceholder(variable_name="history"),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

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
                session_id="test_session",
                connection_string="mongodb://localhost:27017/",
                database_name="testdb",
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
    
    async def query_llm(self, query: str, config: Config):
        input_messages = [HumanMessage(query)]
        response = await self.langchain_app.ainvoke({"messages": input_messages}, config)
        return response

    async def query_llm(self, query: str, config: Config):
        input_messages = [HumanMessage(query)]
        response = await self.langchain_app.ainvoke({"messages": input_messages}, config)
        return response
    

async def main():
    # Define a new graph
    app = StatefulLLM()

    config = {"configurable": {"thread_id": "abc1234"}}

    while True:
        query = input("You: ")
        if query == "exit":
            break

        output = await app.query_llm(query, config)
        print(f"Bot: {output['messages'][-1].content}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())