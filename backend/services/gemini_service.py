import asyncio
import json
import httpx

from ..config import settings


class GeminiError(RuntimeError):
    pass


def configured() -> bool:
    return bool(
        settings.gemini_api_key
        and settings.gemini_model
    )


async def complete_json(system_prompt: str, user_prompt: str) -> dict:

    if not configured():
        raise GeminiError(
            "Gemini is not configured. Add GEMINI_API_KEY to your .env file."
        )

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
    )

    headers = {
        "x-goog-api-key": settings.gemini_api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "role": "user",
            "parts": [{"text": user_prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(
            timeout=settings.request_timeout
        ) as client:

            response = None

            for attempt in range(3):
                try:
                    response = await client.post(
                        url,
                        headers=headers,
                        json=payload
                    )

                except httpx.TransportError:
                    if attempt == 2:
                        raise

                    await asyncio.sleep(2 ** (attempt + 1))
                    continue

                if response.status_code in [429, 500, 502, 503, 504]:
                    if attempt < 2:
                        await asyncio.sleep(2 ** (attempt + 1))
                        continue

                response.raise_for_status()
                break

            data = response.json()

        candidates = data.get("candidates", [])

        if not candidates:
            raise GeminiError(
                "Gemini returned no response candidates."
            )

        parts = candidates[0].get("content", {}).get("parts", [])

        content = "".join(
            part.get("text", "") for part in parts
        ).strip()

        if not content:
            raise GeminiError("Gemini returned an empty response.")

        result = json.loads(content)

        if not isinstance(result, dict):
            raise GeminiError(
                "Gemini returned an invalid JSON object."
            )

        return result

    except GeminiError:
        raise

    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:400]
        raise GeminiError(
            f"Gemini API error ({exc.response.status_code}): {detail}"
        ) from exc

    except (
        httpx.HTTPError,
        json.JSONDecodeError,
        KeyError,
        IndexError
    ) as exc:
        raise GeminiError(
            f"Gemini request failed ({type(exc).__name__}): {repr(exc)[:400]}"
        ) from exc