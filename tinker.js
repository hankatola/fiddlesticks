/*
  Author: Dave Paquette
  Date: 20200128

  Description:
    A script that checks an unknown input brand against a library
    of known good brands and another list of known aliases.
    Returns the input brand if found in brand library
    Returns "Correct" brand if found to be a known aliases
    In the event that it is not a known brand or alias:
      Returns most likely match[s] at or above confidence threshold
      If no match[s] meet confidence threshold - declares a new brand
      if multiple matches have equal qualifying confidence thresholds
        - returns all possible matches and asks for help

  Operation:
    command line
    example, "nodejs tinker.js AK-47 .75 .25"
    argument 3 - string to test
    argument 4 - minimum confidence % to classify as a new alias if
      not found in memory
      defaults to .75 if not entered
    argument 5 - maximum length difference as % between actual strains
      name and input strain name in the event of super short names
      defaults to .25 if not entered
    if you want to test it against more brand names & aliases, just add
      the additional names to the 'strains' & 'aliases' consts  in the same
      format as the existing records
*/


// #region Function Farm
const editDistance = (x, y) => {
  const costs = []
  const xlen = x.length
  const ylen = y.length
  for (let i = 0; i <= xlen; i++) {
    let lastValue = i
    for (let j = 0; j <= ylen; j++) {
      if (i == 0) {
        costs[j] = j
      }
      else {
        if (j > 0) {
          let newValue = costs[j - 1]
          if (x.charAt(i - 1) != y.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          }
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0)
      costs[y.length] = lastValue
  }
  return costs[y.length]
}

const similarity = (s1, s2) => {
  s1 = clean(s1)
  s2 = clean(s2)
  const longer = s1.length < s2.length ? s2 : s1
  const shorter = longer === s1 ? s2 : s1
  const longerLen = longer.length
  if (longerLen === 0) {
    return 1.0
  }
  return (longerLen - editDistance(longer, shorter)) / parseFloat(longerLen)
}

const clean = str => {
  return str.replace(/[^a-z0-9]+/gi,'').toLowerCase()
}
// #endregion Function Farm



// #region  Global Variables
const strains = {
  "Mr. Grimm" : true,
  "Forbidden Fruit" : true,
  "Chemdog" : true,
  "AK-47" : true,
  "Mrs. Grim" : true,
  "Super Lemon Haze" : true
}
const aliases = {// all aliases should be cleaned
  'mrgrim' : "Mr. Grimm",
  'mrgrimms' : "Mr. Grimm",
  'ka74' : 'AK-47',
  'ak47' : 'AK-47',
}
// #endregion Global Variables



// #region    MAIN
const main = (x, confidenceThreshold=.75, maxLengthDiff=.25) => {

  // #region    look for existing records
  // look for  an exact match in strains & aliases, return if found
  if (strains[x]) return console.log(`${x} is a strain that already exists in the library`)

  // look for a match in aliases, return if found
  // from here on only deal w/ cleaned variable
  const cleaned = clean(x)
  if (aliases[x]) return console.log(`${x} is a known alias for ${aliases[x]}, which already exists in the library`)
  // #endregion look for matches


  // #region    Look for possible matches
  // not known. Check strains to see if it's a close enough spelling to be OK
  const possibleMatches = []
  const matchValues = []
  // look for possible matches
  for (let i in strains) {

    const thisStrain = clean(i)

    // Must start w/ the same letter
    if (thisStrain[0] === cleaned[0]) {

      // Must be close enough in length
      const lengthOK =  Math.abs(cleaned.length / thisStrain.length) >= 1 - maxLengthDiff
      if (lengthOK) {
        // Must meet  minimum confidenceThreshold to be considered
        const s = similarity(cleaned,i)
        if (s >= confidenceThreshold) {
          possibleMatches.push(i)
          matchValues.push(s)
        }
      }
    }
  }
  // #endregion Look for possible matches


  //#region     Return Decision
  const matchNum = possibleMatches.length
  if (matchNum === 1) return console.log(`${cleaned} is a new alias for ${possibleMatches[0]}`)
  const bestMatch = []
  if (matchNum > 1) {
    // return the most likely match or matches
    const max = Math.max(...matchValues)
    for (let i = 0; i <=  matchValues.length; i++) {
      if (matchValues[i] === max) bestMatch.push(possibleMatches[i])
    }
  }
  if (bestMatch.length === 0) return console.log(`${x} not found in strains or aliases. ${x} is a new strain`)
  else {
    return console.log('I need help deciding between these:\n',bestMatch)
  }
  //#endregion  Return Decision

}
// #endregion   Main

main(process.argv[2], process.argv[3], process.argv[4])
