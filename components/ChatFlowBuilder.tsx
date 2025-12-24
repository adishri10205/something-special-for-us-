import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    addEdge,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Connection,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChatStep } from '../types';
import { Settings, Plus, Save, Trash2, Edit2 } from 'lucide-react';

interface ChatFlowBuilderProps {
    steps: ChatStep[];
    onUpdate: (steps: ChatStep[]) => void;
    onEditStep: (step: ChatStep) => void;
    onDeleteStep: (stepId: string) => void;
}

const CustomChatNode = ({ data, id }: any) => {
    const isEnd = data.type === 'end';
    return (
        <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 w-64 ${data.isStart ? 'border-green-500' : isEnd ? 'border-gray-800 bg-gray-50' : 'border-gray-200'}`}>
            <Handle type="target" position={Position.Top} className="w-16 !bg-gray-400" />

            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase text-gray-400">{data.type || 'text'}</span>
                    <div className="flex gap-1">
                        <button onClick={() => data.onEdit(data.originalStep)} className="nodrag text-xs text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={12} /></button>
                        <button onClick={() => data.onDelete(data.originalStep.id)} className="nodrag text-xs text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={12} /></button>
                    </div>
                </div>
                {isEnd ? (
                    <div className="font-bold text-sm text-gray-800 text-center py-2">🛑 END CHAT</div>
                ) : (
                    <>
                        <div className="font-bold text-sm text-gray-800 line-clamp-2">{data.question || '(No Question)'}</div>
                        {data.expectedAnswer && (
                            <div className="text-xs text-green-600 mt-1 bg-green-50 p-1 rounded font-mono">Ans: {data.expectedAnswer}</div>
                        )}
                        {data.inputRequired === false && (
                            <div className="mt-1 text-[10px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded w-fit">Statement</div>
                        )}
                    </>
                )}
            </div>

            {/* Main Output (Next) - Only if NOT options type AND NOT End */}
            {!isEnd && data.type !== 'options' && (
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <Handle type="source" position={Position.Bottom} id="next" className="!bg-blue-500 w-3 h-3" />
                    <span className="absolute top-4 left-1/2 transform -translate-x-1/2 text-[8px] text-blue-500 font-bold">NEXT</span>
                </div>
            )}

            {/* Options Branches */}
            {data.type === 'options' && data.options && (
                <div className="absolute -bottom-4 left-0 w-full flex justify-around px-2">
                    {data.options.map((opt: string, i: number) => (
                        <div key={i} className="relative group">
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id={`option-${opt}`}
                                style={{ left: '50%', transform: 'translateX(-50%)' }}
                                className="!bg-purple-500 w-3 h-3"
                            />
                            <span className="absolute top-4 left-1/2 transform -translate-x-1/2 text-[8px] text-purple-600 font-bold whitespace-nowrap bg-white px-1 rounded shadow-sm border border-purple-100">{opt}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Failure Output (Conditional) */}
            {data.inputRequired !== false && (
                <div className="absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <Handle type="source" position={Position.Right} id="fail" className="!bg-red-500 w-3 h-3" />
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[8px] text-red-500 font-bold">FAIL</span>
                </div>
            )}
        </div>
    );
};

const nodeTypes = {
    chatNode: CustomChatNode,
};

const ChatFlowBuilder: React.FC<ChatFlowBuilderProps> = ({ steps, onUpdate, onEditStep, onDeleteStep }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Initialize Graph from Steps
    useEffect(() => {
        if (!steps) return;

        const initialNodes: Node[] = steps.map((step, index) => ({
            id: step.id,
            type: 'chatNode',
            position: step.position || { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
            data: {
                originalStep: step,
                type: step.type,
                question: step.question,
                expectedAnswer: step.expectedAnswer,
                inputRequired: step.inputRequired,
                options: step.options,
                isStart: index === 0, // Assume first in list is start for now, or use ID
                onEdit: onEditStep,
                onDelete: onDeleteStep
            },
        }));

        const initialEdges: Edge[] = [];
        steps.forEach(step => {
            if (step.nextStepId) {
                initialEdges.push({ id: `e${step.id}-${step.nextStepId}`, source: step.id, target: step.nextStepId, sourceHandle: 'next', animated: true, style: { stroke: '#3b82f6' } });
            }
            if (step.failureNextStepId) {
                initialEdges.push({ id: `e${step.id}-${step.failureNextStepId}-fail`, source: step.id, target: step.failureNextStepId, sourceHandle: 'fail', animated: true, style: { stroke: '#ef4444' } });
            }
            if (step.branches) {
                step.branches.forEach(b => {
                    initialEdges.push({
                        id: `e${step.id}-${b.nextStepId}-${b.label}`,
                        source: step.id,
                        target: b.nextStepId,
                        sourceHandle: `option-${b.label}`,
                        animated: true,
                        style: { stroke: '#a855f7' }, // Purple
                        label: b.label,
                        labelStyle: { fill: '#a855f7', fontWeight: 700, fontSize: 10 }
                    });
                });
            }
        });

        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [steps, onEditStep, onDeleteStep, setNodes, setEdges]); // Only re-run if steps array actually changes identity significantly

    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge(params, eds));

        // Update the actual data model
        const sourceId = params.source;
        const targetId = params.target;
        const handleId = params.sourceHandle; // 'next' or 'fail'

        if (sourceId && targetId) {
            const updatedSteps = steps.map(s => {
                if (s.id === sourceId) {
                    if (handleId === 'fail') {
                        return { ...s, failureNextStepId: targetId };
                    } else if (handleId && handleId.startsWith('option-')) {
                        // Branch connection
                        const optionLabel = handleId.replace('option-', '');
                        const existingBranches = s.branches || [];
                        // Update or Add
                        const newBranches = [...existingBranches.filter(b => b.label !== optionLabel), { label: optionLabel, nextStepId: targetId }];
                        return { ...s, branches: newBranches };
                    } else {
                        return { ...s, nextStepId: targetId };
                    }
                }
                return s;
            });
            onUpdate(updatedSteps);
        }
    }, [steps, onUpdate, setEdges]);

    // Handle Node Drag Stop (Save Position)
    const onNodeDragStop = useCallback((event: any, node: Node) => {
        const updatedSteps = steps.map(s => s.id === node.id ? { ...s, position: node.position } : s);
        onUpdate(updatedSteps);
    }, [steps, onUpdate]);

    const onDragOver = useCallback((event: any) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: any) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow/type');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            // check if the dropped element is valid
            const position = {
                x: event.clientX - event.target.getBoundingClientRect().left - 200, // adjust for sidebar
                y: event.clientY - event.target.getBoundingClientRect().top
            };

            // Map type to Step defaults
            const newStep: ChatStep = {
                id: Date.now().toString(),
                order: steps.length + 1,
                type: type as any,
                question: type === 'text' ? 'New Question' : '',
                expectedAnswer: '',
                successReply: '',
                failureReply: '',
                inputRequired: type === 'text' || type === 'options',
                position: position,
                options: type === 'options' ? ['Yes', 'No'] : []
            };

            onUpdate([...steps, newStep]);
        },
        [steps, onUpdate]
    );

    const onDragStart = (event: any, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="w-full h-[600px] flex border rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Sidebar */}
            <div className="w-48 bg-gray-50 border-r p-4 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Components</h3>

                <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:border-blue-400 transition-colors" draggable onDragStart={(e) => onDragStart(e, 'text')}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span> Text Question
                    </div>
                </div>
                <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:border-blue-400 transition-colors" draggable onDragStart={(e) => onDragStart(e, 'options')}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Multiple Choice
                    </div>
                </div>
                <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:border-blue-400 transition-colors" draggable onDragStart={(e) => onDragStart(e, 'image')}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Image
                    </div>
                </div>
                <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:border-blue-400 transition-colors" draggable onDragStart={(e) => onDragStart(e, 'gif')}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span> GIF / Sticker
                    </div>
                </div>
                <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:border-blue-400 transition-colors" draggable onDragStart={(e) => onDragStart(e, 'link')}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Link / Data
                    </div>
                </div>
                <div className="p-3 bg-white border rounded shadow-sm cursor-grab hover:border-blue-400 transition-colors" draggable onDragStart={(e) => onDragStart(e, 'end')}>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                        <span className="w-2 h-2 rounded-full bg-black"></span> End Flow
                    </div>
                </div>

                <div className="mt-auto p-3 bg-blue-50 rounded text-[10px] text-blue-600">
                    Drag components to the canvas to build your flow.
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 h-full relative" onDrop={onDrop} onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeDragStop={onNodeDragStop}
                    nodeTypes={nodeTypes}
                    fitView
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
        </div>
    );
};

export default ChatFlowBuilder;
