import axios, { AxiosError, AxiosResponse } from 'axios';
import React, { ChangeEvent, FormEvent, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';

const YoutubeCard = () => {
    const [url, setUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
  
    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault();
    
    if (!url.includes('youtube.com/shorts/')) {
        setError('Please provide a valid YouTube Shorts URL');
        toast.error('Please provide a valid YouTube Shorts URL');
        return;
    }

    const cleanUrl = url
        .replace(/\?si=.*$/i, '')
        .replace(/&feature=.*$/i, '')
        .trim();
    
    setLoading(true);
    setError(null);

    try {
        const response = await axios.get(buildApiUrl('/download_youtube_short/'), {
            params: { video_url: cleanUrl },
            responseType: 'blob'
        });
          // Create a blob URL and trigger download
          const blob = new Blob([response.data], { type: response.headers['content-type'] });
          const downloadUrl = window.URL.createObjectURL(blob);
          
          // Get filename from Content-Disposition header if available
          const contentDisposition = response.headers['content-disposition'];
          let filename = 'youtube_video.mp4';
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          }
      
          // Create temporary link element to trigger download
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          link.parentNode?.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          
          setUrl(''); // Clear input after successful download
          toast.success('Video downloaded successfully!');
        } catch (err) {
          console.error('Error downloading:', err);
          
          const axiosError = err as AxiosError;
          
          if (axiosError.response) {
            // The request was made and the server responded with an error status
            const errorData = axiosError.response.data;
            
            let errorMessage = 'Failed to download video';
            
            if (errorData instanceof Blob) {
              errorMessage = await new Response(errorData).text().then((text: string) => {
                try {
                  return JSON.parse(text).detail || 'Failed to download video';
                } catch (e) {
                  return 'Failed to download video';
                }
              });
            }
            
            setError(errorMessage);
            toast.error(errorMessage);
          } else {
            const errorMessage = 'Failed to connect to the server. Please try again later.';
            setError(errorMessage);
            toast.error(errorMessage);
          }
        } finally {
          setLoading(false);
        }
      };
      
    
    const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setUrl(e.target.value);
      };
      
      return (
          <div className="container card-cont mx-auto p-4 max-w-lg">
        <h1 className="md:text-5xl text-left text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent mb-10">YT Video Downloader</h1>
        
        <form onSubmit={handleSubmit} className="mb-4 py-5">
          <div className="mb-4">
            <label htmlFor="YtUrl" className="block text-sm font-medium mb-1 text-left">
              Youtube URL
            </label>
            <input
              type="text"
              id="YtUrl"
              value={url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/..."
              className="w-full p-2 rounded-lg text-slate-500 dark:text-slate-400 dark:bg-slate-700 focus:outline-none"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-500 60 hover:border-white-400 my-2"
          >
            {loading ? 'Downloading...' : 'Download '}
          </button>
        </form>
        {error && (
            <div className="bg-red-200 border border-red-400 text-red-900 p-3 rounded mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
            <p>try pasting the link from "copy link"</p>
          </div>
        )}
  <Toaster />
      </div>
    );
}

export default YoutubeCard