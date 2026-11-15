import sys
import speech_recognition as sr

def main():
    if len(sys.argv) < 2:
        return

    audio_path = sys.argv[1]
    recognizer = sr.Recognizer()

    try:
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
            print(text)
    except Exception as e:
        # Silently output nothing on failure so fallback is smooth
        pass

if __name__ == "__main__":
    main()
