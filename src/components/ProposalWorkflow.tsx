import { ArrowDown, CornerDownLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { useProposalWorkflow, ProposalState } from "../hooks/useProposalWorkflow";

export function ProposalWorkflow() {
  const { state, submitData, selectTemplate, finishDrafting, requestRevision, approveProposal, reset } = useProposalWorkflow();

  // Helper to determine styles based on current state
  const isActive = (step: ProposalState) => state.status === step;
  const isPast = (step: ProposalState) => {
    const order: ProposalState[] = ['GATHERING_DATA', 'CHOOSING_TEMPLATE', 'GENERATING_DRAFT', 'INTERNAL_REVIEW', 'READY_TO_SEND'];
    return order.indexOf(state.status) > order.indexOf(step);
  };

  const getStepClass = (step: ProposalState, defaultBg: string, activeBg: string) => {
    if (isActive(step)) return `${activeBg} border-2 border-blue-500 shadow-md transform scale-105 transition-all`;
    if (isPast(step)) return `${defaultBg} opacity-50`;
    return `${defaultBg} opacity-80`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 min-h-[80vh] font-sans">
      <div className="max-w-md w-full flex flex-col items-center space-y-4">
        
        {/* Step 1 */}
        <div className={`w-full rounded-md p-4 text-center transition-all ${getStepClass('GATHERING_DATA', 'bg-[#f4efe8] border-[#d1c9b8]', 'bg-amber-100 border-amber-400')}`}>
          <h3 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
            Proposal data {isPast('GATHERING_DATA') && <CheckCircle2 size={16} className="text-green-600" />}
          </h3>
          <p className="text-sm text-gray-600">CRM, form, or API</p>
          {isActive('GATHERING_DATA') && (
            <button onClick={() => submitData({ name: "Acme Corp" })} className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
              Submit Data
            </button>
          )}
        </div>

        <ArrowDown className={`transition-all ${isPast('GATHERING_DATA') ? 'text-blue-500' : 'text-gray-300'}`} />

        {/* Step 2 */}
        <div className={`w-full rounded-md p-4 text-center transition-all ${getStepClass('CHOOSING_TEMPLATE', 'bg-[#eeeaff] border-[#b8aee6]', 'bg-purple-100 border-purple-400')}`}>
          <h3 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
            Choose template {isPast('CHOOSING_TEMPLATE') && <CheckCircle2 size={16} className="text-green-600" />}
          </h3>
          <p className="text-sm text-gray-600">Merge fields & layout</p>
          {isActive('CHOOSING_TEMPLATE') && (
            <button onClick={() => selectTemplate("Standard B2B")} className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
              Select Template
            </button>
          )}
        </div>

        <ArrowDown className={`transition-all ${isPast('CHOOSING_TEMPLATE') ? 'text-blue-500' : 'text-gray-300'}`} />

        {/* Step 3 */}
        <div className="w-full relative flex items-center justify-center">
          <div className={`w-full rounded-md p-4 text-center z-10 relative transition-all ${getStepClass('GENERATING_DRAFT', 'bg-[#eeeaff] border-[#b8aee6]', 'bg-purple-100 border-purple-400')}`}>
            <h3 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
              Generate draft {isPast('GENERATING_DRAFT') && <CheckCircle2 size={16} className="text-green-600" />}
            </h3>
            <p className="text-sm text-gray-600">Auto-filled from data</p>
            {isActive('GENERATING_DRAFT') && (
              <button onClick={() => finishDrafting()} className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                Finish Generation
              </button>
            )}
            {state.revisionNotes && isActive('GENERATING_DRAFT') && (
               <p className="text-xs text-red-500 mt-2 font-medium">Revising based on: "{state.revisionNotes}"</p>
            )}
          </div>
          {/* Revision loop arrow line (left side) */}
          <div className={`absolute -left-12 top-1/2 bottom-[-100%] w-12 border-l-2 border-t-2 border-dashed rounded-tl-xl hidden md:block transition-all ${isActive('GENERATING_DRAFT') && state.revisionNotes ? 'border-red-400' : 'border-gray-300'}`}></div>
        </div>

        <ArrowDown className={`transition-all ${isPast('GENERATING_DRAFT') ? 'text-blue-500' : 'text-gray-300'}`} />

        {/* Step 4 */}
        <div className="w-full relative flex items-center justify-center">
          <div className={`w-full rounded-md p-4 text-center z-10 relative transition-all ${getStepClass('INTERNAL_REVIEW', 'bg-[#e0f2e9] border-[#93c5a6]', 'bg-teal-100 border-teal-500')}`}>
            <h3 className="font-semibold text-gray-800 flex items-center justify-center gap-2">
              Internal review {isPast('INTERNAL_REVIEW') && <CheckCircle2 size={16} className="text-green-600" />}
            </h3>
            <p className="text-sm text-gray-600">Rectify & verify</p>
            {isActive('INTERNAL_REVIEW') && (
              <div className="flex gap-2 justify-center mt-3">
                <button onClick={() => requestRevision("Pricing needs adjustment")} className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1">
                  <CornerDownLeft size={14} /> Request Revision
                </button>
                <button onClick={() => approveProposal()} className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors flex items-center gap-1">
                  <CheckCircle2 size={14} /> Approve
                </button>
              </div>
            )}
          </div>
          {/* Revision loop arrow text and bottom line */}
          <div className="absolute -left-36 top-1/2 h-full items-center hidden md:flex">
             <span className={`text-xs font-medium whitespace-nowrap bg-gray-50 px-1 mr-2 flex items-center transition-all ${isActive('GENERATING_DRAFT') && state.revisionNotes ? 'text-red-500' : 'text-gray-400'}`}>
               <CornerDownLeft size={12} className="mr-1" />
               Needs revision
             </span>
          </div>
          <div className={`absolute -left-12 top-1/2 w-12 border-l-2 border-b-2 border-dashed rounded-bl-xl hidden md:block transition-all ${isActive('GENERATING_DRAFT') && state.revisionNotes ? 'border-red-400' : 'border-gray-300'}`}></div>
        </div>

        <ArrowDown className={`transition-all ${isPast('INTERNAL_REVIEW') ? 'text-blue-500' : 'text-gray-300'}`} />

        {/* Step 5 */}
        <div className={`w-full rounded-md p-4 text-center transition-all ${getStepClass('READY_TO_SEND', 'bg-[#eef6da] border-[#a6c589]', 'bg-green-100 border-green-500')}`}>
          <h3 className="font-semibold text-gray-800">Verified proposal</h3>
          <p className="text-sm text-gray-600">Ready to send</p>
          {isActive('READY_TO_SEND') && (
            <button onClick={() => reset()} className="mt-3 px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 mx-auto">
              <RotateCcw size={14} /> Start Over
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
