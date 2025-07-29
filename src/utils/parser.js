/**
 * Parse PHP print_r() output and convert it to JavaScript object/JSON
 */
export function parsePhpPrintR(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string')
  }

  const lines = input.trim().split('\n').map(line => line.replace(/\r$/, ''))
  
  if (lines.length === 0) {
    throw new Error('Empty input')
  }

  let index = 0
  const result = parseValue(lines, index)
  
  return result.value
}

function parseValue(lines, startIndex) {
  let index = startIndex
  
  // Skip empty lines
  while (index < lines.length && lines[index].trim() === '') {
    index++
  }
  
  if (index >= lines.length) {
    throw new Error('Unexpected end of input')
  }

  const line = lines[index].trim()
  
  // Check if it's an array declaration
  if (line === 'Array' || line.startsWith('Array')) {
    return parseArray(lines, index)
  }
  
  // Check if it's a simple value (shouldn't happen at top level but handle it)
  throw new Error('Expected Array declaration at top level')
}

function parseNestedArray(lines, startIndex) {
  let index = startIndex
  
  // Current line should be "[key] => Array"
  // Find the opening parenthesis for this nested array
  index++ // Move to next line
  while (index < lines.length && !lines[index].includes('(')) {
    index++
  }
  
  if (index >= lines.length) {
    throw new Error('Missing opening parenthesis for nested Array')
  }
  
  // Now parse the array contents starting from the opening parenthesis
  return parseArrayContents(lines, index)
}

function parseArray(lines, startIndex) {
  let index = startIndex
  
  // Skip "Array" line
  index++
  
  // Skip to opening parenthesis
  while (index < lines.length && !lines[index].includes('(')) {
    index++
  }
  
  if (index >= lines.length) {
    throw new Error('Missing opening parenthesis for Array')
  }
  
  // Now parse the array contents starting from the opening parenthesis
  return parseArrayContents(lines, index)
}

function parseArrayContents(lines, openParenIndex) {
  let index = openParenIndex
  const result = {}
  let isNumericArray = true
  let numericIndex = 0
  
  index++ // Skip the opening parenthesis line
  
  // Parse array contents
  while (index < lines.length) {
    const line = lines[index].trim()
    
    // Check for closing parenthesis
    if (line === ')') {
      index++
      break
    }
    
    // Skip empty lines
    if (line === '') {
      index++
      continue
    }
    
    // Parse key-value pair
    const keyValueMatch = line.match(/^\[([^\]]+)\] => ?(.*)$/)
    if (keyValueMatch) {
      const key = keyValueMatch[1]
      const valueStart = keyValueMatch[2]
      
      // Check if the key is numeric
      const numericKey = parseInt(key)
      if (isNaN(numericKey) || numericKey.toString() !== key || numericKey !== numericIndex) {
        isNumericArray = false
      } else {
        numericIndex++
      }
      
      let value
      let nextIndex
      
      // Check if value is an array
      if (valueStart.trim() === 'Array') {
        // For nested arrays, we need to find where the Array declaration starts
        // The current line has "[key] => Array", so we pass the current index
        // and let parseArray handle finding the opening parenthesis
        const arrayResult = parseNestedArray(lines, index)
        value = arrayResult.value
        nextIndex = arrayResult.nextIndex
      } else {
        // Simple value
        value = parseSimpleValue(valueStart)
        nextIndex = index + 1
      }
      
      result[key] = value
      index = nextIndex
    } else {
      // Might be a continuation of an array declaration
      if (line === 'Array') {
        // This is the start of a nested array, but we need the key
        // Look back for the key in the previous line or current context
        throw new Error('Unexpected Array declaration without key at line: ' + line)
      }
      index++
    }
  }
  
  // Convert to array if it's a numeric array
  if (isNumericArray && Object.keys(result).length > 0) {
    const arrayResult = []
    for (let i = 0; i < numericIndex; i++) {
      arrayResult[i] = result[i.toString()]
    }
    return { value: arrayResult, nextIndex: index }
  }
  
  return { value: result, nextIndex: index }
}

function parseSimpleValue(valueStr) {
  const trimmed = valueStr.trim()
  
  // Handle empty values
  if (trimmed === '') {
    return ''
  }
  
  // Handle numeric values
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed)
  }
  
  if (/^\d*\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed)
  }
  
  // Handle boolean-like values
  if (trimmed === '1') {
    return true
  }
  
  if (trimmed === '0' || trimmed === '') {
    return false
  }
  
  // Everything else is a string
  return trimmed
} 