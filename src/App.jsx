import React, { useState, useRef, useEffect } from 'react'
import './App.css'
import { parsePhpPrintR } from './utils/parser'

const App = () => {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  
  // Search-related state
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const [searchTarget, setSearchTarget] = useState('both') // 'input', 'output', 'both'
  const [showHelpTooltip, setShowHelpTooltip] = useState(false)
  
  const inputRef = useRef(null)
  const outputRef = useRef(null)

  // Search functionality
  const findMatches = (text, term) => {
    if (!term || !text) return []
    
    const matches = []
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let match
    
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      })
      // Prevent infinite loop with zero-length matches
      if (match.index === regex.lastIndex) {
        regex.lastIndex++
      }
    }
    
    return matches
  }

  const performSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      setCurrentMatchIndex(-1)
      return
    }

    const results = []
    
    if (searchTarget === 'input' || searchTarget === 'both') {
      const inputMatches = findMatches(input, searchTerm)
      inputMatches.forEach(match => {
        results.push({ ...match, source: 'input' })
      })
    }
    
    if (searchTarget === 'output' || searchTarget === 'both') {
      const outputMatches = findMatches(output, searchTerm)
      outputMatches.forEach(match => {
        results.push({ ...match, source: 'output' })
      })
    }
    
    setSearchResults(results)
    setCurrentMatchIndex(results.length > 0 ? 0 : -1)
  }

  const navigateToMatch = (index) => {
    if (index < 0 || index >= searchResults.length) return
    
    const match = searchResults[index]
    const textarea = match.source === 'input' ? inputRef.current : outputRef.current
    
    if (textarea) {
      textarea.focus()
      textarea.setSelectionRange(match.start, match.end)
      textarea.scrollTop = Math.max(0, textarea.scrollHeight * (match.start / textarea.value.length) - textarea.clientHeight / 2)
    }
    
    setCurrentMatchIndex(index)
  }

  const nextMatch = () => {
    if (searchResults.length === 0) return
    const nextIndex = currentMatchIndex < searchResults.length - 1 ? currentMatchIndex + 1 : 0
    navigateToMatch(nextIndex)
  }

  const prevMatch = () => {
    if (searchResults.length === 0) return
    const prevIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : searchResults.length - 1
    navigateToMatch(prevIndex)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setCurrentMatchIndex(-1)
  }

  const toggleHelpTooltip = () => {
    setShowHelpTooltip(!showHelpTooltip)
  }

  const closeHelpTooltip = () => {
    setShowHelpTooltip(false)
  }

  // Perform search when search term or target changes
  useEffect(() => {
    performSearch()
  }, [searchTerm, input, output, searchTarget])

  // Navigate to first match when search results change
  useEffect(() => {
    if (searchResults.length > 0 && currentMatchIndex === -1) {
      navigateToMatch(0)
    }
  }, [searchResults])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector('.search-input')
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
      
      // Escape to clear search when search input is focused
      if (e.key === 'Escape' && e.target.classList.contains('search-input')) {
        clearSearch()
        e.target.blur()
      }
      
      // F3 or Ctrl/Cmd + G to go to next match
      if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey)) {
        e.preventDefault()
        if (searchResults.length > 0) {
          nextMatch()
        }
      }
      
      // Shift + F3 or Shift + Ctrl/Cmd + G to go to previous match
      if ((e.key === 'F3' && e.shiftKey) || ((e.ctrlKey || e.metaKey) && e.key === 'g' && e.shiftKey)) {
        e.preventDefault()
        if (searchResults.length > 0) {
          prevMatch()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [searchResults, currentMatchIndex])

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showHelpTooltip && !e.target.closest('.search-help')) {
        closeHelpTooltip()
      }
    }

    if (showHelpTooltip) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showHelpTooltip])

  const handleConvert = () => {
    if (!input.trim()) {
      setError('Please enter some PHP print_r() output')
      setOutput('')
      return
    }

    setIsConverting(true)
    setError('')
    
    // Add a small delay for retro effect
    setTimeout(() => {
      try {
        const result = parsePhpPrintR(input)
        setOutput(JSON.stringify(result, null, 2))
        setError('')
      } catch (err) {
        setError('Error parsing PHP print_r() output: ' + err.message)
        setOutput('')
      }
      setIsConverting(false)
    }, 300)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError('')
  }

  const handleCopyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output)
    }
  }

  const sampleData = `Array
(
    [name] => John Doe
    [age] => 30
    [city] => New York
    [hobbies] => Array
        (
            [0] => reading
            [1] => coding
            [2] => gaming
        )
    [active] => 1
    [profile] => Array
        (
            [email] => john@example.com
            [phone] => 555-0123
        )
    [tags] => Array
        (
            [0] => developer
            [1] => gamer
            [2] => reader
            [3] => tech-enthusiast
        )
)`

  const handleLoadSample = () => {
    setInput(sampleData)
    setOutput('')
    setError('')
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">
            <span className="title-bracket">[</span>
            PHP print_r() → JSON
            <span className="title-bracket">]</span>
          </h1>
          <p className="subtitle">Convert PHP print_r() output to JSON</p>
        </header>

        {/* Search Component */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search in content... (Ctrl+F)"
                className="search-input"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            
            <div className="search-controls">
              <select
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                className="search-target-select"
              >
                <option value="both">Both</option>
                <option value="input">Input</option>
                <option value="output">Output</option>
              </select>
              
              {searchResults.length > 0 && (
                <>
                  <div className="search-results-info">
                    {currentMatchIndex + 1} of {searchResults.length}
                  </div>
                  <button
                    onClick={prevMatch}
                    className="search-nav-btn"
                    title="Previous match"
                  >
                    ↑
                  </button>
                  <button
                    onClick={nextMatch}
                    className="search-nav-btn"
                    title="Next match"
                  >
                    ↓
                  </button>
                </>
              )}
              
              {searchTerm && searchResults.length === 0 && (
                <div className="search-no-results">
                  No matches found
                </div>
              )}
              
              <div 
                className={`search-help ${showHelpTooltip ? 'show-tooltip' : ''}`} 
                title="Keyboard shortcuts: Ctrl+F (focus), Esc (clear), F3/Ctrl+G (navigate)"
                onClick={toggleHelpTooltip}
              >
                ?
              </div>
            </div>
          </div>
          
          {/* Mobile Help Section */}
          {showHelpTooltip && (
            <div className="mobile-help-section">
              <div className="mobile-help-content">
                <h4>Keyboard Shortcuts</h4>
                <ul>
                  <li><strong>Ctrl+F</strong> - Focus search input</li>
                  <li><strong>Esc</strong> - Clear search</li>
                  <li><strong>F3</strong> or <strong>Ctrl+G</strong> - Next match</li>
                  <li><strong>Shift+F3</strong> or <strong>Shift+Ctrl+G</strong> - Previous match</li>
                </ul>
                <button 
                  className="mobile-help-close"
                  onClick={closeHelpTooltip}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="converter">
          <div className="input-section">
            <div className="section-header">
              <h2>PHP print_r() Output</h2>
              <button 
                className="sample-btn"
                onClick={handleLoadSample}
                title="Load sample data"
              >
                Load Sample
              </button>
            </div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your PHP print_r() output here..."
              className="input-textarea"
              rows={15}
            />
          </div>

          <div className="controls">
            <button 
              onClick={handleConvert}
              className={`convert-btn ${isConverting ? 'converting' : ''}`}
              disabled={isConverting}
            >
              {isConverting ? 'CONVERTING...' : 'CONVERT'}
            </button>
            <button 
              onClick={handleClear}
              className="clear-btn"
            >
              CLEAR
            </button>
          </div>

          <div className="output-section">
            <div className="section-header">
              <h2>JSON Output</h2>
              {output && (
                <button 
                  className="copy-btn"
                  onClick={handleCopyOutput}
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              )}
            </div>
            
            {error && (
              <div className="error">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}
            
            <textarea
              ref={outputRef}
              value={output}
              readOnly
              placeholder="JSON output will appear here..."
              className="output-textarea"
              rows={15}
            />
          </div>
        </div>

        <footer className="footer">
          <p>Made with ❤️ for PHP devs</p>
          <a 
            href="https://github.com/cubefreaker/php-printr-to-json" 
            target="_blank" 
            rel="noopener noreferrer"
            className="github-badge"
            title="View on GitHub"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="24" 
              height="24" 
              fill="currentColor"
              className="github-icon"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </footer>
      </div>
    </div>
  )
}

export default App 