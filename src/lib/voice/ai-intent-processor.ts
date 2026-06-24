// ─── SelfSync Voice — AI Intent Processor ──────────────────────────────
// Orchestrates between Groq AI (primary) and fuzzy parser (fallback).
// Converts transcripts → structured commands → executes actions → returns results.
// ────────────────────────────────────────────────────────────────────────

import type { AiCommand, CommandResult, VoiceLanguage } from './types'
import { processTranscript, isGroqConfigured } from './groq-service'
import { parseIntent } from './intent-parser'
import { executeCommand } from './command-registry'
import { executeAiCommand } from './command-registry'

// ─── Intent Processing ─────────────────────────────────────────────────

/**
 * Process a transcript using AI-first approach:
 * 1. If Groq is configured, try AI parsing first
 * 2. If Groq fails or returns "unknown", fall back to keyword parser
 * 3. Execute the resolved command and return result
 */
export async function processVoiceTranscript(
  transcript: string
): Promise<{
  result: CommandResult
  language: VoiceLanguage
  isAiProcessed: boolean
}> {
  const groqAvailable = isGroqConfigured()

  if (groqAvailable) {
    try {
      const aiCommand = await processTranscript(transcript)

      // If Groq understood the command, execute it via AI handler
      if (aiCommand.action !== 'unknown') {
        const result = executeAiCommand(aiCommand)
        return {
          result,
          language: aiCommand.language || detectLanguage(transcript),
          isAiProcessed: true,
        }
      }

      // Groq returned "unknown" — fall through to keyword parser
      console.log('[AIProcessor] Groq returned unknown, falling back to keyword parser')
    } catch (error) {
      console.warn('[AIProcessor] Groq processing failed, falling back to keyword parser:', error)
    }
  }

  // Fallback: use existing keyword-based intent parser
  const parsed = parseIntent(transcript)
  const result = executeCommand(parsed)
  return {
    result,
    language: parsed.language,
    isAiProcessed: false,
  }
}

/**
 * Detect language from text (simple Unicode check).
 */
function detectLanguage(text: string): VoiceLanguage {
  const bengaliRegex = /[\u0980-\u09FF]/
  return bengaliRegex.test(text) ? 'bn' : 'en'
}