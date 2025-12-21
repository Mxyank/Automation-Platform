import { useState, useRef, useEffect, type KeyboardEvent, type ChangeEvent } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { featureRegistry, type Feature } from "@shared/feature-registry";

export function SearchBar() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredFeatures = query.length > 0
    ? featureRegistry.filter(feature =>
        feature.title.toLowerCase().includes(query.toLowerCase()) ||
        feature.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredFeatures.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && filteredFeatures[selectedIndex]) {
      e.preventDefault();
      navigate(filteredFeatures[selectedIndex].href);
      setQuery("");
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (feature: Feature) => {
    navigate(feature.href);
    setQuery("");
    setIsOpen(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search tools..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-9 bg-dark-card border-gray-700 text-white w-64 focus:border-neon-cyan/50 placeholder:text-gray-500"
          data-testid="input-search"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && filteredFeatures.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          {filteredFeatures.map((feature, index) => (
            <div
              key={feature.id}
              onClick={() => handleSelect(feature)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-neon-cyan/10 border-l-2 border-neon-cyan"
                  : "hover:bg-gray-800 border-l-2 border-transparent"
              }`}
              data-testid={`search-result-${feature.id}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${feature.gradient} flex items-center justify-center`}>
                  <Search className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{feature.title}</p>
                  <p className="text-gray-400 text-xs truncate">{feature.description}</p>
                </div>
                {feature.badge && (
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                    {feature.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.length > 0 && filteredFeatures.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-gray-700 rounded-lg shadow-xl z-50 p-4"
        >
          <p className="text-gray-400 text-sm text-center">No tools found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
