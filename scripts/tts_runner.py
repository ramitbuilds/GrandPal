import sys
import asyncio
import edge_tts

async def main():
    if len(sys.argv) < 3:
        print("Usage: python tts_runner.py <output_file> <text> [voice]")
        sys.exit(1)

    outfile = sys.argv[1]
    text = sys.argv[2]
    # en-US-AnaNeural is sweet, friendly and youthful (great for puppy companion)
    # en-US-JennyNeural is warm, clear and soothing
    voice = sys.argv[3] if len(sys.argv) > 3 else "en-US-AnaNeural"

    # Calm pacing for elderly seniors: -5% rate
    communicate = edge_tts.Communicate(text, voice, rate="-5%", pitch="+0Hz")
    await communicate.save(outfile)

if __name__ == "__main__":
    asyncio.run(main())
