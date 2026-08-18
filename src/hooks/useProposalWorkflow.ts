import { useReducer } from 'react';

export type ProposalState = 
  | 'GATHERING_DATA'
  | 'CHOOSING_TEMPLATE'
  | 'GENERATING_DRAFT'
  | 'INTERNAL_REVIEW'
  | 'READY_TO_SEND';

type Action = 
  | { type: 'SUBMIT_DATA'; payload: any }
  | { type: 'SELECT_TEMPLATE'; payload: string }
  | { type: 'DRAFT_GENERATED' }
  | { type: 'NEEDS_REVISION'; payload: string }
  | { type: 'APPROVE' }
  | { type: 'RESET' };

interface WorkflowState {
  status: ProposalState;
  data: any | null;
  templateId: string | null;
  revisionNotes: string | null;
}

const initialState: WorkflowState = {
  status: 'GATHERING_DATA',
  data: null,
  templateId: null,
  revisionNotes: null,
};

function workflowReducer(state: WorkflowState, action: Action): WorkflowState {
  switch (action.type) {
    case 'SUBMIT_DATA':
      if (state.status !== 'GATHERING_DATA') return state;
      return { ...state, status: 'CHOOSING_TEMPLATE', data: action.payload };
      
    case 'SELECT_TEMPLATE':
      if (state.status !== 'CHOOSING_TEMPLATE') return state;
      return { ...state, status: 'GENERATING_DRAFT', templateId: action.payload };
      
    case 'DRAFT_GENERATED':
      if (state.status !== 'GENERATING_DRAFT') return state;
      return { ...state, status: 'INTERNAL_REVIEW', revisionNotes: null };
      
    case 'NEEDS_REVISION':
      if (state.status !== 'INTERNAL_REVIEW') return state;
      return { ...state, status: 'GENERATING_DRAFT', revisionNotes: action.payload };
      
    case 'APPROVE':
      if (state.status !== 'INTERNAL_REVIEW') return state;
      return { ...state, status: 'READY_TO_SEND' };
      
    case 'RESET':
      return initialState;
      
    default:
      return state;
  }
}

export function useProposalWorkflow() {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  return {
    state,
    submitData: (data: any) => dispatch({ type: 'SUBMIT_DATA', payload: data }),
    selectTemplate: (templateId: string) => dispatch({ type: 'SELECT_TEMPLATE', payload: templateId }),
    finishDrafting: () => dispatch({ type: 'DRAFT_GENERATED' }),
    requestRevision: (notes: string) => dispatch({ type: 'NEEDS_REVISION', payload: notes }),
    approveProposal: () => dispatch({ type: 'APPROVE' }),
    reset: () => dispatch({ type: 'RESET' }),
  };
}
