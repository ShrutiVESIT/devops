import React, { useState, FormEvent, ChangeEvent } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';

function App(): JSX.Element {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('reel_url', url);

      // Make API request with responseType blob to handle binary data
      const response: AxiosResponse<Blob> = await axios.post(buildApiUrl('/download_reel/'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob', // Important for handling the file stream
      });

      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'instagram_reel.mp4';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
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
    } catch (err) {
      console.error('Error downloading reel:', err);
      
      const axiosError = err as AxiosError;
      
      if (axiosError.response) {
        // The request was made and the server responded with an error status
        const errorData = axiosError.response.data;
        
        let errorMessage = 'Failed to download reel';
        
        toast.error(errorMessage);
        if (errorData instanceof Blob) {
          errorMessage = await new Response(errorData).text().then((text: string) => {
            try {
              return JSON.parse(text).detail || 'Failed to download reel';
            } catch (e) {
              return `Failed to download reel - ${e.message}`; ;
            }
          });
        }
        
        setError(errorMessage);
      } else {
        setError('Failed to connect to the server. Please try again later.');
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
      <h1 className="md:text-5xl text-left text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent mb-10">Instagram Reel Downloader</h1>
      
      <form onSubmit={handleSubmit} className="mb-4 py-5">
        <div className="mb-4">
          <label htmlFor="reelUrl" className="block text-sm font-medium mb-1 text-left">
            Instagram Reel URL
          </label>
          <input
            type="text"
            id="reelUrl"
            value={url}
            onChange={handleChange}
            placeholder="https://www.instagram.com/reel/..."
            className="w-full p-2 rounded-lg text-slate-500 dark:text-slate-400 dark:bg-slate-700 focus:outline-none"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500 60 hover:border-white-400 my-2"
        >
          {loading ? 'Downloading...' : 'Download Reel'}
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

export default App;