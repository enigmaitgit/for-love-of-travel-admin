'use client';

import * as React from 'react';
import { X, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagSelector({ 
  selectedTags, 
  onTagsChange, 
  placeholder = "Add tags...",
  maxTags = 10,
  className 
}: TagSelectorProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Debounced search for suggestions
  React.useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (inputValue.trim() && inputValue.length >= 1) {
        await fetchSuggestions(inputValue.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const fetchSuggestions = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/tags?search=${encodeURIComponent(searchTerm)}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        // Filter suggestions based on search term, but don't filter out already selected tags
        // This allows users to see and re-add tags they've used before
        const filteredSuggestions = data.data.filter((tag: string) => 
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
      } else {
        // If API returns error, show no suggestions
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.warn('Error fetching tag suggestions:', error);
      // On error, show no suggestions but don't break the UI
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && selectedTags.length < maxTags) {
      // Check if tag is already selected
      if (!selectedTags.includes(trimmedTag)) {
        onTagsChange([...selectedTags, trimmedTag]);
      }
    }
    setInputValue('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSuggestions([]);
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setShowSuggestions(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  return (
    <div className={cn("relative", className)}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2 min-h-8 p-2 border border-input rounded-md bg-background">
        {selectedTags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive transition-colors"
              aria-label={`Remove ${tag} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {/* Input Field */}
        <div className="flex-1 min-w-20 relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={selectedTags.length === 0 ? placeholder : ""}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="border-none bg-transparent outline-none text-sm placeholder:text-muted-foreground p-0 h-auto"
            disabled={selectedTags.length >= maxTags}
          />
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>

      {/* Tag Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Search className="h-3 w-3" />
              Suggested tags
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-accent hover:text-accent-foreground rounded flex items-center gap-2 transition-colors"
              >
                <Plus className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="flex justify-between items-center mt-1">
        <p className="text-xs text-muted-foreground">
          {selectedTags.length}/{maxTags} tags
        </p>
        {selectedTags.length >= maxTags && (
          <p className="text-xs text-muted-foreground">
            Maximum tags reached
          </p>
        )}
      </div>
    </div>
  );
}
