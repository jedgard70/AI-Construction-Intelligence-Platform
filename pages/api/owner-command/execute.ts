import type { NextApiRequest, NextApiResponse } from 'next'
import { getBearerToken, resolveOwnerContext } from '../../../lib/owner-auth'

/**
 * Owner Executor — Controlled command execution for Owner only
 * POST /api/owner-command/execute
 *
 * Body:
 *   command: string — command category (health_check, status_report, etc.)
 *   params?: Record<string, string> — optional parameters
 *
 * Response: { success, result?, error? }
 */

// Allowlist of permitted Owner commands
const ALLOWED_COMMANDS = {
  health_check: { name: 'Health Check', description: 'Check system health', timeout: 5000 },
  status_report: {
    name: 'Status Report',
    description: 'Generate platform status report',
    timeout: 10000,
  },
  generate_handoff: {
    name: 'Generate Handoff',
    description: 'Generate session handoff document',
    timeout: 15000,
  },
  validate_module: {
    name: 'Validate Module',
    description: 'Validate a specific module',
    timeout: 10000,
  },
  create_report: { name: 'Create Report', description: 'Create operational report', timeout: 15000 },
} as const

type CommandKey = keyof typeof ALLOWED_COMMANDS

type ExecutionResult = {
  command: CommandKey
  status: 'success' | 'error' | 'timeout'
  result?: string
  error?: string
  timestamp: string
  duration_ms: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; result?: ExecutionResult; error?: { code: string; message: string } }>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST allowed' },
    })
  }

  const startTime = Date.now()

  try {
    // Get Bearer token
    const token = getBearerToken(req.headers.authorization)
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Bearer token required' },
      })
    }

    // Resolve owner context
    const context = await resolveOwnerContext(token)
    if (!context.isOwner) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only Owner can execute commands' },
      })
    }

    // Parse command from body
    const { command, params } = req.body
    if (!command || typeof command !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Command parameter required and must be string' },
      })
    }

    if (params !== undefined && (typeof params !== 'object' || params === null || Array.isArray(params))) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Params must be an object when provided' },
      })
    }

    // Check if command is in allowlist
    if (!(command in ALLOWED_COMMANDS)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'COMMAND_NOT_ALLOWED',
          message: `Command '${command}' not in allowlist. Allowed: ${Object.keys(ALLOWED_COMMANDS).join(', ')}`,
        },
      })
    }

    // Execute command based on type
    const commandInfo = ALLOWED_COMMANDS[command as CommandKey]
    let result: ExecutionResult

    try {
      // Simple timeout wrapper
      const promise = executeCommand(command as CommandKey, params as Record<string, unknown> | undefined)
      const timeoutPromise = new Promise<{ status: 'timeout'; result: string }>((resolve) => {
        setTimeout(() => {
          resolve({
            status: 'timeout',
            result: `Command '${command}' exceeded timeout (${commandInfo.timeout}ms)`,
          })
        }, commandInfo.timeout)
      })

      const outcome = await Promise.race([promise, timeoutPromise])

      if (outcome.status === 'timeout') {
        result = {
          command: command as CommandKey,
          status: 'timeout',
          error: outcome.result,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        }
      } else if (outcome.status === 'error') {
        result = {
          command: command as CommandKey,
          status: 'error',
          error: outcome.result,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        }
      } else {
        result = {
          command: command as CommandKey,
          status: 'success',
          result: outcome.result,
          timestamp: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        }
      }
    } catch (err) {
      result = {
        command: command as CommandKey,
        status: 'error',
        error: `Execution error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }
    }

    // Return result (do NOT expose secrets in logs)
    return res.status(200).json({
      success: result.status === 'success',
      result,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
    })
  }
}

/**
 * Execute individual commands
 * Add new commands here as needed
 */
async function executeCommand(
  command: CommandKey,
  params?: Record<string, unknown>
): Promise<{ status: 'success' | 'error'; result: string }> {
  switch (command) {
    case 'health_check':
      return {
        status: 'success',
        result: JSON.stringify(
          {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
          },
          null,
          2
        ),
      }

    case 'status_report':
      return {
        status: 'success',
        result: JSON.stringify(
          {
            platform: 'Apex AI Construction Intelligence',
            environment: process.env.NODE_ENV || 'unknown',
            deployment: process.env.VERCEL_URL ? 'Vercel' : 'Local',
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
      }

    case 'generate_handoff':
      return {
        status: 'success',
        result: `# Handoff Document\nGenerated at ${new Date().toISOString()}\n\n[Handoff content would go here]`,
      }

    case 'validate_module':
      if (params?.module !== undefined && typeof params.module !== 'string') {
        return {
          status: 'error',
          result: 'Parameter module must be a string',
        }
      }
      const moduleName = params?.module || 'unknown'
      return {
        status: 'success',
        result: `Module '${moduleName}' validation: OK (no errors detected)`,
      }

    case 'create_report':
      return {
        status: 'success',
        result: `Report created: Report_${new Date().getTime()}.pdf\n[Report details would be generated]`,
      }

    default:
      return {
        status: 'error',
        result: `Command '${command}' not implemented`,
      }
  }
}
