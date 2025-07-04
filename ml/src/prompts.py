from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import Prompt
import random

async def get_all_prompts(session: AsyncSession):
    result = await session.execute(select(Prompt))
    return result.scalars().all()

async def get_random_prompt(session: AsyncSession):
    prompts = await get_all_prompts(session)
    return random.choice(prompts) if prompts else None

async def get_prompt_text(session: AsyncSession, prompt_id: str) -> str | None:
    result = await session.execute(select(Prompt).where(Prompt.id == prompt_id))
    prompt = result.scalar_one_or_none()
    return prompt.text if prompt else None