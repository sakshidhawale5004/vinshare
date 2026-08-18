import { createFileRoute } from '@tanstack/react-router'
import { ProposalWorkflow } from '../components/ProposalWorkflow'

export const Route = createFileRoute('/workflow')({
  component: WorkflowComponent,
})

function WorkflowComponent() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Proposal Workflow</h1>
        <ProposalWorkflow />
      </div>
    </div>
  )
}
