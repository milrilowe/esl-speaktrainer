from database import Base, engine, AsyncSessionLocal
from models import Prompt
import asyncio
from uuid import uuid4

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        session.add_all([
            Prompt(id=str(uuid4()), text="Hello"),
            Prompt(id=str(uuid4()), text="Say your name"),
        ])
        await session.commit()

if __name__ == "__main__":
    asyncio.run(seed())