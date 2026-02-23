/**
 * Skill Loader
 *
 * Reads skill markdown files from the skills/ directory and assembles them
 * into system instruction blocks. Lightweight DIY alternative to ADK's
 * SkillToolset — works with our existing @google/genai setup.
 */

import fs from 'fs'
import path from 'path'

const SKILLS_DIR = path.join(process.cwd(), 'src/lib/copilot/adk/skills')

/** Cache loaded skill content to avoid repeated disk reads */
const skillCache = new Map<string, string>()

/**
 * Load a single skill markdown file by name (without .md extension).
 * Returns the file content as a string.
 */
export function loadSkill(name: string): string {
  const cached = skillCache.get(name)
  if (cached) return cached

  const filePath = path.join(SKILLS_DIR, `${name}.md`)
  const content = fs.readFileSync(filePath, 'utf-8')
  skillCache.set(name, content)
  return content
}

/**
 * Load a skill and replace template variables.
 * Variables use {{variableName}} syntax.
 */
export function loadSkillWithVars(
  name: string,
  vars: Record<string, string>
): string {
  let content = loadSkill(name)
  for (const [key, value] of Object.entries(vars)) {
    content = content.replaceAll(`{{${key}}}`, value)
  }
  return content
}

/**
 * Load a skill but only return content before the first "---" separator.
 * Useful for skills that have a base section and an extended section
 * (e.g., run-workflow has a base procedure + detailed run-mode protocol).
 */
export function loadSkillBase(name: string): string {
  const content = loadSkill(name)
  const separatorIndex = content.indexOf('\n---\n')
  if (separatorIndex === -1) return content
  return content.slice(0, separatorIndex).trimEnd()
}

/**
 * Load multiple skills and concatenate them with double newlines.
 */
export function loadSkills(names: string[]): string {
  return names.map((name) => loadSkill(name)).join('\n\n')
}
