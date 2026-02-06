import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { RxSpeakerLoud } from 'react-icons/rx';
import { buildApiUrl } from '../../lib/api';
import { CardHeader, SubmitButton, LoadingSpinner } from '../shared/CardComponents';

interface Voice {
  Id: string;
  Name: string;
  Gender: string;
  LanguageName: string;
}

const AUDIO_FORMATS: Record<string, string> = {
  ogg_vorbis: 'audio/ogg',
  mp3: 'audio/mpeg',
  pcm: 'audio/wave; codecs=1',
};

const SpeechCard: React.FC = () => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [supportedFormats, setSupportedFormats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const getSupportedAudioFormats = (player: HTMLAudioElement): string[] => {
    return Object.keys(AUDIO_FORMATS).filter((format) => {
      const supported = player.canPlayType(AUDIO_FORMATS[format]);
      return supported === 'probably' || supported === 'maybe';
    });
  };

  const fetchVoices = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<Voice[]>(buildApiUrl('/voices'));
      setVoices(response.data);
    } catch (error) {
      const err = error as AxiosError;
      console.error(`Error fetching voices: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const player = document.getElementById('player') as HTMLAudioElement;
    const supported = getSupportedAudioFormats(player);

    if (supported.length > 0) {
      setSupportedFormats(supported);
    } else {
      console.warn('Browser does not support available audio formats');
    }
    fetchVoices();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!selectedVoice || !text.trim()) {
      return;
    }

    const player = document.getElementById('player') as HTMLAudioElement;
    const audioUrl = buildApiUrl(
      `/read?voiceId=${encodeURIComponent(selectedVoice)}&text=${encodeURIComponent(text)}&outputFormat=${supportedFormats[0]}`
    );
    
    player.src = audioUrl;
    setIsPlaying(true);
    player.play();
    
    player.onended = () => setIsPlaying(false);
    player.onerror = () => setIsPlaying(false);
  };

  return (
    <div className="poppins-regular card-cont">
      <CardHeader
        title="SpeechSynth Bot"
        description="Text-to-speech powered by AWS Polly"
      />

      <form id="input" onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col justify-start items-start">
          <label htmlFor="voice" className="font-light text-lg mb-2">
            Select a voice
          </label>
          {isLoading ? (
            <div className="w-full">
              <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-12 rounded-lg w-full" />
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <LoadingSpinner size="sm" />
                Loading voices...
              </div>
            </div>
          ) : (
            <select
              id="voice"
              name="voiceId"
              value={selectedVoice}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedVoice(e.target.value)}
              className="
                rounded-lg w-full py-3 px-3
                bg-slate-100 dark:bg-slate-700 
                text-slate-700 dark:text-slate-300
                border border-slate-300 dark:border-slate-600
                focus:outline-none focus:ring-2 focus:ring-indigo-500
                transition-colors
              "
              disabled={voices.length === 0}
            >
              <option value="">Choose a voice...</option>
              {voices.map((voice) => (
                <option key={voice.Id} value={voice.Id}>
                  {voice.Name} [{voice.LanguageName}] ({voice.Gender})
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-col justify-start items-start my-5">
          <label htmlFor="text" className="font-light text-lg mb-2">
            Text to read
          </label>
          <textarea
            id="text"
            maxLength={1000}
            minLength={10}
            rows={5}
            name="text"
            required
            value={text}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)}
            className="
              w-full p-3 rounded-lg
              bg-slate-100 dark:bg-slate-700 
              text-slate-700 dark:text-slate-300
              border border-slate-300 dark:border-slate-600
              focus:outline-none focus:ring-2 focus:ring-indigo-500
              transition-colors resize-none
            "
            placeholder="Type some text here..."
          />
          <p className="text-xs text-slate-500 mt-1">
            {text.length}/1000 characters
          </p>
        </div>

        <SubmitButton
          loading={isPlaying}
          disabled={!selectedVoice || text.length < 10}
          loadingText="Playing..."
        >
          Read Aloud
          <RxSpeakerLoud className="inline ml-2" size="1.2em" />
        </SubmitButton>
      </form>

      <audio id="player" className="hidden" />
    </div>
  );
};

export default SpeechCard;