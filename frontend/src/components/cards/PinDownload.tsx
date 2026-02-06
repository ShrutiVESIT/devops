import { useState, FormEvent, ChangeEvent } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { buildApiUrl } from '../../lib/api';

const PinDownload = () => {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // First validate it's a Pinterest URL
    if (!url.includes('pinterest.com') && !url.includes('pin.it')) {
      setError('Please enter a valid Pinterest URL');
      toast.error('Invalid Pinterest URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pinterest_url', url);

      // Directly calling your FastAPI backend as in original
      const response: AxiosResponse<Blob> = await axios.post(
        buildApiUrl('/download_pinterest_video/'),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob',
        }
      );

      // Rest of your original download handling code
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'pinterest_video.mp4';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setUrl('');
      toast.success('Pinterest video downloaded!');
    } catch (err) {
      const axiosError = err as AxiosError;
      
      if (axiosError.response) {
        const errorData = axiosError.response.data;
        let errorMessage = 'Failed to download video';
        
        if (errorData instanceof Blob) {
          errorMessage = await new Response(errorData).text();
          try {
            const parsedError = JSON.parse(errorMessage);
            errorMessage = parsedError.detail || errorMessage;
          } catch {
            // If not JSON, keep raw message
          }
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        setError('Failed to connect to the server');
        toast.error('Server connection failed');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
  };
    
  return (
    <div className="container card-cont mx-auto p-4 max-w-lg">
      <h1 className="md:text-5xl text-left text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent mb-10">
        Pinterest Video Downloader
      </h1>
      
      <form onSubmit={handleSubmit} className="mb-4 py-5">
        <div className="mb-4">
          <label htmlFor="pinUrl" className="block text-sm font-medium mb-1 text-left">
            Pinterest Video URL
          </label>
          <input
            type="text"
            id="pinUrl"
            value={url}
            onChange={handleChange}
            placeholder="https://www.pinterest.com/pin/..."
            className="w-full p-2 rounded-lg text-slate-500 dark:text-slate-400 dark:bg-slate-700 focus:outline-none"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Downloading...' : 'Download Video'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-200 border border-red-400 text-red-900 p-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <p>Try pasting the link from "copy link"</p>
        </div>
      )}
      
      <Toaster />
    </div>
  );
};

export default PinDownload;