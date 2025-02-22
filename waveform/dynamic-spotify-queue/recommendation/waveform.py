#!/usr/bin/env python3
"""
Script: extract_waveform.py
Description: 
  1) Converts an MP3 (or any supported audio) file into a WAV file
  2) Optionally extracts sample amplitude data (waveform) from the audio.

Usage:
    python extract_waveform.py <input_audio_file> [<output_wav_path>] [<output_csv_path>]

Example:
    python extract_waveform.py my_song.mp3 output.wav waveform.csv
"""

import sys
import csv
from pydub import AudioSegment

def extract_waveform(audio_file_path):
    """
    Extract the waveform (sample amplitudes) from an audio file.

    :param audio_file_path: Path to the input audio file (mp3, wav, etc.).
    :return: A list of sample amplitudes.
    """
    # Load the audio file
    audio = AudioSegment.from_file(audio_file_path)

    # pydub's get_array_of_samples returns raw audio data as a sequence
    samples = audio.get_array_of_samples()

    # Convert it to a list of integers (so it can be easily manipulated)
    waveform = list(samples)
    return waveform

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_waveform.py <input_audio_file> [<output_wav_path>] [<output_csv_path>]")
        sys.exit(1)

    # Required input audio file (MP3, WAV, etc.)
    input_audio_file = sys.argv[1]

    # Optional output WAV path (defaults to "output.wav" if not provided)
    output_wav_path = sys.argv[2] if len(sys.argv) > 2 else "output.wav"

    # Optional output CSV path (for the waveform)
    output_csv_path = sys.argv[3] if len(sys.argv) > 3 else None

    # --- 1) Convert input audio to WAV ---
    print(f"Converting '{input_audio_file}' to WAV format...")
    audio_segment = AudioSegment.from_file(input_audio_file)
    audio_segment.export(output_wav_path, format="wav")
    print(f"Saved WAV file to: {output_wav_path}")

    # --- 2) Extract waveform data (if the user also wants CSV) ---
    if output_csv_path:
        print(f"Extracting waveform from '{output_wav_path}'...")

        # We extract waveform data from the newly created WAV file,
        # but you could also directly extract it from the original input.
        waveform_data = extract_waveform(output_wav_path)
        print(f"Extracted {len(waveform_data)} samples.")

        # Save waveform data to CSV
        with open(output_csv_path, mode='w', newline='') as csv_file:
            writer = csv.writer(csv_file)
            # Write headers
            writer.writerow(["SampleIndex", "Amplitude"])
            # Write each amplitude with its index
            for i, amplitude in enumerate(waveform_data):
                writer.writerow([i, amplitude])

        print(f"Waveform data saved to {output_csv_path}.")
    else:
        # If not outputting CSV, optionally just show the first few samples
        print("No CSV path provided; skipping waveform extraction.")

if __name__ == "__main__":
    main()
