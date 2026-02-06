import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { BsGraphUp, BsVolumeUp, BsStop } from "react-icons/bs";
import { IoMdClose } from "react-icons/io";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { RiEyeCloseFill, RiEyeFill } from "react-icons/ri";
import { buildApiUrl } from "../../lib/api";

interface Company {
  name: string;
  symbol: string;
  sector: string;
  country: string;
  website: string;
  currency: string;
  pe_ratio: number | null;
  forward_pe: number | null;
  price_to_book: number | null;
  market_cap: number | null;
  eps: number | null;
  revenue_growth: number | null;
  profit_margins: number | null;
  beta: number | null;
  debt_to_equity: number | null;
  "52_week_high": number | null;
  "52_week_low": number | null;
  volume: number | null;
  avg_volume: number | null;
  dividend_yield: number | null;
  day_high: number | null;
  current_price: number | null;
  previous_close: number | null;
  day_low: number | null;
}

interface MetricRowProps {
  label: string;
  value: string | number | null | undefined;
}

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  current_price?: string | number;
  currency?: string;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  nickname: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value }) => (
  <tr className="border-t border-gray-300">
    <td className="p-2 font-medium">{label}</td>
    <td className="p-2 text-right">{value || "N/A"}</td>
  </tr>
);

const formatPercent = (value: number | null | undefined): string => {
  return value ? `${(value * 100).toFixed(2)}%` : "N/A";
};

const formatNumber = (value: number | null | undefined): string => {
  return value ? value.toLocaleString() : "N/A";
};

interface AnalysisResponse {
  analysis: string;
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Add this new component near your other interfaces
const SearchResultsContainer = ({ 
  isSearching, 
  searchResults, 
  searchQuery, 
  handleAddToWatchlist 
}: { 
  isSearching: boolean;
  searchResults: SearchResult[];
  searchQuery: string;
  handleAddToWatchlist: (symbol: string, name: string) => void;
}) => {
  if (isSearching) {
    return null;
  }

  if (searchQuery.length >= 2 && searchResults.length === 0) {
    return (
      <div className="mt-2 absolute z-10 w-full p-4 rounded-lg border
                    border-gray-300 dark:border-gray-600 
                    bg-white dark:bg-slate-700 shadow-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No matches found for "{searchQuery}"</p>
          {/* <p className="text-sm mt-1">Try searching with a different term</p> */}
        </div>
      </div>
    );
  }

  if (searchResults.length > 0) {
    return (
      <div className="mt-2 absolute z-10 w-full max-h-60 overflow-y-auto rounded-lg border 
                    border-gray-300 dark:border-gray-600 
                    bg-white dark:bg-slate-700 shadow-lg">
        {searchResults.map((result) => (
          <div
            key={result.symbol}
            className="flex justify-between items-center p-3 
                     hover:bg-gray-100 dark:hover:bg-slate-600
                     border-b border-gray-200 dark:border-gray-600
                     last:border-b-0"
          >
            <div className="text-left flex-1">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {result.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">
                  {result.symbol}
                </span>
                <span>{result.exchange}</span>
                {result.current_price && (
                  <span className="font-medium">
                    {result.current_price} {result.currency}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleAddToWatchlist(result.symbol, result.name)}
              className="ml-4 px-3 py-1.5 bg-indigo-500 text-white rounded-md
                       hover:bg-indigo-600 transition-colors duration-200
                       text-sm font-medium flex items-center gap-1"
            >
              <span>Add</span>
              <span className="text-xs">+</span>
            </button>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const StockAnalysis = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [showWatchlist, setShowWatchlist] = useState<boolean>(true);
  const [isLoadingWatchlist, setIsLoadingWatchlist] = useState<boolean>(true);
  const [numStocks, setNumStocks] = useState<number>(1); // Add to your StockAnalysis component state

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get<{ companies: Company[] }>(
        buildApiUrl('/companies')
      );
      setCompanies(response.data.companies);
      

    } catch (error) {
      console.error("Error fetching company data:", error);
    } finally {
      setIsLoading(false);
      
    }
  };

  const fetchWatchlist = async () => {
    setIsLoadingWatchlist(true);
    try {
      const response = await axios.get(buildApiUrl('/watchlist'));
      setWatchlist(response.data.watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setIsLoadingWatchlist(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const response = await axios.get<{ results: SearchResult[] }>(
          buildApiUrl(`/watchlist/search?query=${encodeURIComponent(query)}`)
        );

        if (response.data.results) {
          setSearchResults(response.data.results);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      setIsSearching(true);
    }
    debouncedSearch(query);
  };

  const handleAddToWatchlist = async (symbol: string) => {
    const nickname = symbol; // Use the ticker symbol as the nickname

    try {
      const symbolParam = encodeURIComponent(symbol);
      const nicknameParam = encodeURIComponent(nickname);
      await axios.post(
        buildApiUrl(`/watchlist/add?symbol=${symbolParam}&nickname=${nicknameParam}`)
      );
      await fetchCompanies();
      await fetchWatchlist();
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
      alert("Failed to add stock to watchlist");
    }
  };

  const handleRemoveFromWatchlist = async (nickname: string) => {
    try {
      const endpoint = buildApiUrl(`/watchlist/remove/${encodeURIComponent(nickname)}`);
      await axios.delete(endpoint);
      await fetchWatchlist();
      await fetchCompanies();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchWatchlist();
  }, []);

  const handleSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = companies.find(
      (company) => company.symbol === event.target.value
    );
    setSelectedCompany(selected || null);
    setAnalysis("");
  };

  const handleClearAnalysis = () => {
    setAnalysis("");
    handleStop();
  };

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompany) {
      alert("Please select a company first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await axios.post<AnalysisResponse>(
        buildApiUrl('/analyze_stock'),
        {
          ...selectedCompany,
          num_stocks: numStocks, // send number of stocks
        }
      );
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Failed to analyze stock data");
    } finally {
      setIsAnalyzing(false);
    }
  };
  const disabled = true 
  // SET THIS FALSE TO CONTINUE DEVELOPMENT
  const handleStop = () => {
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
      setIsReading(false);
      setAudioPlayer(null);
    }
  };

  const handleReadAnalysis = async () => {
    if (!analysis || isReading) return;

    const plainText = analysis.replace(/[#_*`~>\n]/g, " ").trim();

    setIsReading(true);
    try {
      const response = await axios.post(
        buildApiUrl('/read'),
        {
          text: plainText,
          voiceId: "Joey",
          outputFormat: "mp3",
        },
        { responseType: "blob" }
      );

      const audioBlob = new Blob([response.data], { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      setAudioPlayer(audio);

      audio.onended = () => {
        setIsReading(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();
    } catch (error) {
      console.error("Error reading analysis:", error);
      setIsReading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
        URL.revokeObjectURL(audioPlayer.src);
      }
    };
  }, [audioPlayer]);

  return (
    // <div className="card-cont poppins-regular relative">
      ( disabled ? <div className="card-cont poppins-regular relative">
      <div className="mb-12 space-y-2">
        <h1 className="md:text-5xl text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
          Analytica AI
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          AI-Powered Stock Analysis & Insights
        </p>
      </div>

      {/* Maintenance Message */}
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg mb-4">
          <svg 
            className="w-12 h-12 text-yellow-600 dark:text-yellow-500 mx-auto mb-3" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <h2 className="text-xl font-bold text-yellow-700 dark:text-yellow-400 text-center mb-2">
            Temporarily Unavailable
          </h2>
          <p className="text-yellow-600 dark:text-yellow-300 text-center">
            We're currently updating our stock analysis service to provide you with better insights. 
            Please check back later.
          </p>
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-center">
          <p className="mb-2">
            Expected features when we're back:
          </p>
          <ul className="list-disc list-inside text-left max-w-md mx-auto">
            <li>Real-time stock analysis</li>
            <li>AI-powered insights</li>
            <li>Portfolio tracking</li>
            <li>Market trends analysis</li>
          </ul>
        </div>
      </div>
    </div>
      :
       <div className="card-cont poppins-regular relative">
      <div>
      {/* Watchlist Panel */}

      <div className="mb-12 space-y-2">
        <h1 className="md:text-5xl text-3xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
          Analytica AI
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          AI-Powered Stock Analysis & Insights
        </p>
      </div>


      {/* search bar */}
      <div className="mb-6 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for stocks..."
            className="w-full p-3 pl-4 rounded-lg
                     bg-white dark:bg-slate-700 
                     text-gray-900 dark:text-gray-100
                     shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-indigo-500
                     placeholder-gray-400 dark:placeholder-gray-500"
            value={searchQuery}
            onChange={handleSearchInput}
          />
          <div className="absolute right-3 top-3">
            {isSearching && (
              <div className="animate-spin h-5 w-5 border-2 
                           border-indigo-500 border-t-transparent rounded-full">
              </div>
            )}
          </div>
        </div>

        <SearchResultsContainer
          isSearching={isSearching}
          searchResults={searchResults}
          searchQuery={searchQuery}
          handleAddToWatchlist={handleAddToWatchlist}
        />
      </div>
      {/* watchlist */}
      <div
        className={`
         bg-white dark:bg-slate-800 my-2
        rounded-lg shadow-lg p-4 transition-transform duration-300
        ${showWatchlist ? "translate-x-0" : "-translate-y-1.5"}
      `}
      >

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg mx-2">Watchlist</h3>
          <button
            onClick={() => setShowWatchlist(!showWatchlist)}
            className="p-2 rounded-full transition-all duration-200
             hover:bg-slate-100 dark:hover:bg-slate-700
             text-indigo-500 hover:text-indigo-600
             dark:text-indigo-400 dark:hover:text-indigo-300
             hover:scale-110 transform
             flex items-center justify-center focus:outline-none border-none"
            aria-label={showWatchlist ? "Hide watchlist" : "Show watchlist"}
          >
            {showWatchlist ? (
              <RiEyeCloseFill size={20} />
            ) : (
              <RiEyeFill size={20} />
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {isLoadingWatchlist ? (
            <>
              <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-16 rounded-lg"></div>
              <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-16 rounded-lg"></div>
              <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-16 rounded-lg"></div>
              <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-16 rounded-lg"></div>
            </>
          ) : watchlist.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 col-span-2 text-center py-4">
              No stocks in watchlist
            </p>
          ) : (
            watchlist.map((item) => (
              <div
                key={item.nickname}
                className={`flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-700 rounded
                  hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors duration-200
                  ${showWatchlist ? " hidden " : " "}`}
              >
                <div className="text-left">
                  <div className="font-medium">{item.nickname}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.symbol}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFromWatchlist(item.nickname)}
                  className="p-1.5 rounded-full transition-all duration-200
                    hover:bg-slate-50 dark:hover:bg-slate-700
             text-indigo-500 hover:text-indigo-600
             dark:text-indigo-400 dark:hover:text-indigo-300
                     transform
                    flex items-center justify-center
                    focus:outline-none"
                  aria-label={`Remove ${item.nickname} from watchlist`}
                >
                  <IoMdClose size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>            
      {/* Company Selection and Analysis */}
      <form id="input" onSubmit={handleAnalysis} className="w-full">
        <div className="flex flex-col justify-start items-center my-10">
          <label className="font-light text-slate-500 text-sm my-2">
            Select a publicly traded company to start analyzing
          </label>
          {isLoading ? (
            <div className="w-full">
              <div className="animate-pulse bg-slate-200 dark:bg-slate-600 h-12 rounded-lg w-full"></div>
              <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Loading companies...
              </div>
            </div>
          ) : (
            <select
              id="company-select"
              onChange={handleSelection}
              className="rounded-lg w-full outline-none border-none py-3 px-4
    bg-white dark:bg-slate-700 
    text-slate-700 dark:text-slate-300
    shadow-md hover:shadow-lg
    transition-all duration-200
    cursor-pointer
    focus:ring-2 focus:ring-indigo-500
    dark:focus:ring-indigo-400"
            >
              <option value="" className="text-gray-500">
                Choose from watchlist...
              </option>
              {companies.map((company) => (
                <option
                  key={company.symbol}
                  value={company.symbol}
                  className="py-2"
                >
                  {company.name} ({company.symbol})
                </option>
              ))}
            </select>
          )}
          {/* Add this below the select */}
          <div className="mt-4 w-full flex flex-col items-start">
            <label htmlFor="num-stocks" className="text-sm text-slate-500 mb-1">
              Number of stocks you plan to invest:
            </label>
            <input
              id="num-stocks"
              type="number"
              min={1}
              value={numStocks}
              onChange={e => setNumStocks(Number(e.target.value))}
              className="w-32 rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          {selectedCompany && (
            <div className="px-4 py-4 my-2 w-full dark:bg-slate-800 rounded-lg text-left">
              <h3 className="text-2xl mb-3 font-bold">
                {selectedCompany.name}
              </h3>
              <p>
                <span className="text-blue-300">Sector</span>{" "}
                {selectedCompany.sector}
              </p>
              <div>
                <table className="w-full trading-metrics">
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td
                        colSpan={2}
                        className="pt-4 pb-2 font-bold text-blue-500"
                      >
                        Price Metrics
                      </td>
                    </tr>
                    <MetricRow
                      label="Current Price"
                      value={selectedCompany.current_price}
                    />
                    <MetricRow
                      label="Previous Close"
                      value={selectedCompany.previous_close}
                    />
                    <MetricRow
                      label="Day High"
                      value={selectedCompany.day_high}
                    />
                    <MetricRow
                      label="Day Low"
                      value={selectedCompany.day_low}
                    />
                    <MetricRow
                      label="52W High"
                      value={selectedCompany["52_week_high"]}
                    />
                    <MetricRow
                      label="52W Low"
                      value={selectedCompany["52_week_low"]}
                    />
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td
                        colSpan={2}
                        className="pt-4 pb-2 font-bold text-blue-500"
                      >
                        Volume & Market Cap
                      </td>
                    </tr>
                    <MetricRow
                      label="Volume"
                      value={formatNumber(selectedCompany.volume)}
                    />
                    <MetricRow
                      label="Avg Volume"
                      value={formatNumber(selectedCompany.avg_volume)}
                    />
                    <MetricRow
                      label="Market Cap"
                      value={selectedCompany.market_cap}
                    />
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td
                        colSpan={2}
                        className="pt-4 pb-2 font-bold text-blue-500"
                      >
                        Financial Metrics
                      </td>
                    </tr>
                    <MetricRow
                      label="P/E Ratio"
                      value={selectedCompany.pe_ratio}
                    />
                    <MetricRow label="EPS" value={selectedCompany.eps} />
                    <MetricRow label="Beta" value={selectedCompany.beta} />
                    <MetricRow
                      label="Dividend Yield"
                      value={formatPercent(selectedCompany.dividend_yield)}
                    />
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!selectedCompany || isAnalyzing}
          className={`
            px-10 py-3 mx-auto my-4 rounded-md
            ${
              !selectedCompany
                ? "hidden"
                : "bg-indigo-500 hover:bg-indigo-600"
            }
            text-white font-medium flex items-center justify-center gap-2
            transition-colors duration-200
          `}
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              Analyzing...
            </>
          ) : (
            <>
              <BsGraphUp className="text-xl" />
              Analyze Stock
            </>
          )}
        </button>

        {analysis && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg relative"
            >
              <div className="absolute top-4 right-4 flex items-center space-x-2">
                <button
                  onClick={handleReadAnalysis}
                  disabled={isReading}
                  className={`p-2 rounded-full transition-all duration-200 
                    ${
                      isReading
                        ? "bg-indigo-300"
                        : "bg-indigo-500 hover:bg-indigo-600 hover:scale-110"
                    } 
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                    shadow-lg`}
                  aria-label="Read analysis"
                >
                  <BsVolumeUp size={20} className="text-white" />
                </button>
                <button
                  onClick={handleStop}
                  disabled={!audioPlayer}
                  className="p-2 rounded-full transition-all duration-200 bg-red-700 hover:bg-red-800 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-600 shadow-lg"
                  aria-label="Stop speech"
                >
                  <BsStop size={20} className="text-white" />
                </button>
                <button
                  onClick={handleClearAnalysis}
                  className="p-2 bg-slate-700 
                    hover:bg-slate-600 
                    rounded-full shadow-lg transform transition-all duration-200
                    hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Close analysis"
                >
                  <IoMdClose
                    size={20}
                    className="text-gray-600 dark:text-gray-300"
                  />
                </button>
              </div>
              <div className="prose prose-indigo dark:prose-invert max-w-none text-left">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">
                    AI overview
                    <span className="px-2 my-2 w-4/5 h-[0.5px] rounded-full bg-slate-600 block"></span>
                  </h1>
                </div>
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => (
                      <h1
                        className="text-2xl font-bold mb-4 text-indigo-500"
                        {...props}
                      />
                    ),
                    h2: ({ ...props }) => (
                      <h2
                        className="text-xl font-bold mb-3 text-indigo-400 mt-4"
                        {...props}
                      />
                    ),
                    h3: ({ ...props }) => (
                      <h3
                        className="text-lg font-bold mb-2 text-indigo-300"
                        {...props}
                      />
                    ),
                    p: ({ ...props }) => (
                      <p
                        className="mb-4 text-gray-700 dark:text-gray-300"
                        {...props}
                      />
                    ),
                    ul: ({ ...props }) => (
                      <ul className="list-disc ml-4 mb-4" {...props} />
                    ),
                    li: ({ ...props }) => (
                      <li
                        className="mb-2 text-gray-700 dark:text-gray-300"
                        {...props}
                      />
                    ),
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </form>
      <audio id="player"></audio>


      </div> </div>
     
      )

    // </div>
  );
};

export default StockAnalysis;
