/**
 * Migration Script: Tool → Swarm
 *
 * This script migrates existing Tool data to the new Swarm model.
 * It converts documentation HTML to a simple workflow node.
 *
 * Run with: npx ts-node scripts/migrate-to-swarms.ts
 * Or: npx tsx scripts/migrate-to-swarms.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  console.log('Starting migration from Tool to Swarm...\n')

  try {
    // Check if there are any existing Swarm records (in case table was already migrated)
    const existingSwarms = await prisma.swarm.count()
    console.log(`Found ${existingSwarms} existing swarms`)

    if (existingSwarms > 0) {
      console.log('Swarms already exist. Checking for records without workflow data...\n')
    }

    // Find swarms that have no workflow data (legacy documentation data)
    const swarmsToMigrate = await prisma.swarm.findMany({
      where: {
        workflowNodes: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    console.log(`Found ${swarmsToMigrate.length} swarms to migrate\n`)

    let migrated = 0
    let failed = 0

    for (const swarm of swarmsToMigrate) {
      try {
        // Create a basic workflow node from the description
        const nodes = [{
          id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'step',
          position: { x: 100, y: 100 },
          data: {
            label: swarm.name,
            description: swarm.description?.substring(0, 200) || '',
            instructions: '',
            linkedAgentUrl: '',
          },
        }]

        await prisma.swarm.update({
          where: { id: swarm.id },
          data: {
            workflowNodes: JSON.stringify(nodes),
            workflowEdges: JSON.stringify([]),
            workflowMetadata: JSON.stringify({}),
            workflowVersion: '1.0',
          },
        })

        console.log(`  ✓ Migrated: ${swarm.name}`)
        migrated++
      } catch (error) {
        console.error(`  ✗ Failed to migrate: ${swarm.name}`, error)
        failed++
      }
    }

    console.log('\n=== Migration Complete ===')
    console.log(`Migrated: ${migrated}`)
    console.log(`Failed: ${failed}`)

  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\nMigration finished successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nMigration failed with error:', error)
    process.exit(1)
  })
