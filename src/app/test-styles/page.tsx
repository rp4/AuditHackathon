"use client"

import { useEffect, useState } from "react"

export default function TestStyles() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Debug CSS Variables
    const root = document.documentElement
    const computedStyles = getComputedStyle(root)

    const cssVars = {
      primary: computedStyles.getPropertyValue('--primary'),
      background: computedStyles.getPropertyValue('--background'),
      foreground: computedStyles.getPropertyValue('--foreground'),
      border: computedStyles.getPropertyValue('--border'),
      muted: computedStyles.getPropertyValue('--muted'),
    }

    // Debug stylesheets
    const stylesheets = Array.from(document.styleSheets).map(sheet => {
      try {
        return {
          href: sheet.href,
          rules: sheet.cssRules ? sheet.cssRules.length : 0,
          media: sheet.media ? sheet.media.mediaText : 'none'
        }
      } catch (e) {
        return { href: sheet.href, error: 'Cannot access rules (CORS)' }
      }
    })

    // Check if Tailwind classes are being applied
    const testDiv = document.createElement('div')
    testDiv.className = 'bg-purple-600 text-white p-4'
    document.body.appendChild(testDiv)
    const testStyles = getComputedStyle(testDiv)
    const tailwindWorking = {
      backgroundColor: testStyles.backgroundColor,
      color: testStyles.color,
      padding: testStyles.padding,
    }
    document.body.removeChild(testDiv)

    // Check for CSS files
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => {
      const linkEl = link as HTMLLinkElement
      return linkEl.href
    })

    const info = {
      cssVariables: cssVars,
      stylesheets: stylesheets,
      tailwindTest: tailwindWorking,
      cssLinks: cssLinks,
      bodyClasses: document.body.className,
      htmlClasses: document.documentElement.className,
    }

    setDebugInfo(info)

    // Log to console
    console.log('=== CSS Debug Info ===')
    console.log('CSS Variables:', cssVars)
    console.log('Stylesheets:', stylesheets)
    console.log('Tailwind Test:', tailwindWorking)
    console.log('CSS Links:', cssLinks)
    console.log('Body Classes:', document.body.className)
    console.log('HTML Classes:', document.documentElement.className)
    console.log('=====================')
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">Tailwind CSS Debug Page</h1>

      {/* Visual Tests */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Visual Tests</h2>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Standard Tailwind Colors (should be colored)</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="w-32 h-32 bg-red-500 rounded-lg p-4 text-white">
              bg-red-500
            </div>
            <div className="w-32 h-32 bg-blue-500 rounded-lg p-4 text-white">
              bg-blue-500
            </div>
            <div className="w-32 h-32 bg-green-500 rounded-lg p-4 text-white">
              bg-green-500
            </div>
            <div className="w-32 h-32 bg-purple-600 rounded-lg p-4 text-white">
              bg-purple-600
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Borders & Shadows (should have effects)</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg p-4">
              border-2
            </div>
            <div className="w-32 h-32 bg-white shadow-md rounded-lg p-4">
              shadow-md
            </div>
            <div className="w-32 h-32 bg-white shadow-xl rounded-lg p-4">
              shadow-xl
            </div>
            <div className="w-32 h-32 bg-white shadow-2xl rounded-lg p-4">
              shadow-2xl
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Text Sizes (should be different sizes)</h3>
          <div className="space-y-2">
            <p className="text-xs">text-xs: The quick brown fox</p>
            <p className="text-sm">text-sm: The quick brown fox</p>
            <p className="text-base">text-base: The quick brown fox</p>
            <p className="text-lg">text-lg: The quick brown fox</p>
            <p className="text-xl">text-xl: The quick brown fox</p>
            <p className="text-2xl">text-2xl: The quick brown fox</p>
            <p className="text-4xl">text-4xl: The quick brown fox</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Custom Theme Colors</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="w-32 h-32 bg-primary rounded-lg p-4 text-primary-foreground">
              bg-primary
            </div>
            <div className="w-32 h-32 bg-secondary rounded-lg p-4 text-secondary-foreground">
              bg-secondary
            </div>
            <div className="w-32 h-32 bg-muted rounded-lg p-4 text-muted-foreground">
              bg-muted
            </div>
            <div className="w-32 h-32 bg-accent rounded-lg p-4 text-accent-foreground">
              bg-accent
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info Display */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Debug Information (Check Console)</h2>
        <div className="bg-gray-100 rounded-lg p-4 font-mono text-xs overflow-auto">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      </div>

      {/* Inline Style Test */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Inline Style Test (should always work)</h2>
        <div
          style={{
            width: '128px',
            height: '128px',
            backgroundColor: 'purple',
            color: 'white',
            padding: '16px',
            borderRadius: '8px'
          }}
        >
          Inline styles
        </div>
      </div>

      {/* JavaScript Style Check */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">JavaScript Applied Styles</h2>
        <button
          onClick={() => {
            const testEl = document.getElementById('js-test')
            if (testEl) {
              testEl.style.backgroundColor = '#8B5CF6'
              testEl.style.color = 'white'
              testEl.style.padding = '16px'
              testEl.style.borderRadius = '8px'
              console.log('Applied styles via JavaScript')
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
        >
          Click to Apply JS Styles
        </button>
        <div id="js-test" className="w-32 h-32 border-2 border-gray-300">
          Click button above
        </div>
      </div>

      {/* Check if styles are in head */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Style Elements in Head</h2>
        <button
          onClick={() => {
            const styles = document.querySelectorAll('style')
            const links = document.querySelectorAll('link[rel="stylesheet"]')
            console.log('Style tags found:', styles.length)
            console.log('Stylesheet links found:', links.length)
            styles.forEach((style, i) => {
              console.log(`Style ${i}:`, style.innerHTML.substring(0, 100) + '...')
            })
            links.forEach((link, i) => {
              console.log(`Link ${i}:`, (link as HTMLLinkElement).href)
            })
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Log Style Elements to Console
        </button>
      </div>
    </div>
  )
}