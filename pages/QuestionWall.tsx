import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleQuestion, Plus, Send, Trash2, Edit2, Check, X, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { db } from '../src/firebaseConfig';
import { Question } from '../types/question';

const QuestionWall: React.FC = () => {
    const { currentUser, isAdmin } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [answeringId, setAnsweringId] = useState<string | null>(null);
    const [answerText, setAnswerText] = useState('');
    const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered'>('all');

    // Fetch questions
    useEffect(() => {
        const questionsRef = ref(db, 'questions');
        const unsubscribe = onValue(questionsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                // Sort: unanswered first, then by date
                list.sort((a, b) => {
                    if (a.status !== b.status) return a.status === 'unanswered' ? -1 : 1;
                    return new Date(b.askedAt).getTime() - new Date(a.askedAt).getTime();
                });
                setQuestions(list);
            } else {
                setQuestions([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.trim() || !currentUser) return;

        const questionRef = push(ref(db, 'questions'));
        const newEntry: Omit<Question, 'id'> = {
            question: newQuestion,
            askedBy: currentUser.uid,
            askedByName: currentUser.displayName || 'Anonymous',
            askedAt: new Date().toISOString(),
            status: 'unanswered'
        };

        try {
            await set(questionRef, newEntry);
            setNewQuestion('');
        } catch (error) {
            console.error("Failed to add question", error);
            alert("Failed to post question.");
        }
    };

    const handleAnswer = async (questionId: string) => {
        if (!answerText.trim() || !currentUser) return;

        // Show warning before submitting
        const confirmed = confirm(
            "⚠️ Important Notice\n\n" +
            "Once you submit this answer, you CANNOT delete it yourself.\n" +
            "Only admins can remove answers.\n\n" +
            "Are you sure you want to submit this answer?"
        );

        if (!confirmed) return;

        try {
            await update(ref(db, `questions/${questionId}`), {
                answer: answerText,
                answeredBy: currentUser.uid,
                answeredByName: currentUser.displayName || 'Anonymous',
                answeredAt: new Date().toISOString(),
                status: 'answered'
            });
            setAnsweringId(null);
            setAnswerText('');
        } catch (error) {
            console.error("Failed to answer", error);
            alert("Failed to submit answer.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!isAdmin) {
            alert("Only admins can delete questions.");
            return;
        }
        if (confirm("Are you sure you want to delete this question?")) {
            try {
                await remove(ref(db, `questions/${id}`));
            } catch (e) {
                console.error("Delete failed", e);
            }
        }
    };

    const handleDeleteAnswer = async (questionId: string) => {
        if (!isAdmin) {
            alert("Only admins can delete answers.");
            return;
        }
        if (confirm("Are you sure you want to delete this answer? The question will remain.")) {
            try {
                await update(ref(db, `questions/${questionId}`), {
                    answer: null,
                    answeredBy: null,
                    answeredByName: null,
                    answeredAt: null,
                    status: 'unanswered'
                });
            } catch (e) {
                console.error("Delete answer failed", e);
            }
        }
    };

    const filteredQuestions = questions.filter(q => {
        if (filter === 'all') return true;
        return q.status === filter;
    });

    return (
        <div className="min-h-screen pt-20 pb-24 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl mx-auto"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto flex items-center justify-center mb-4 text-purple-500 shadow-lg shadow-purple-200">
                        <MessageCircleQuestion size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Question Wall</h1>
                    <p className="text-gray-600">Ask the questions you never dared to ask 💭</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-6 w-full max-w-md mx-auto">
                    {(['all', 'unanswered', 'answered'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all capitalize ${filter === tab
                                ? 'bg-purple-50 text-purple-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Add Question Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-4 mb-6">
                    <form onSubmit={handleAddQuestion}>
                        <textarea
                            value={newQuestion}
                            onChange={(e) => setNewQuestion(e.target.value)}
                            placeholder="What's on your mind? Ask anything..."
                            className="w-full p-4 bg-purple-50/50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-purple-100 transition-all min-h-[100px]"
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                type="submit"
                                disabled={!newQuestion.trim()}
                                className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 disabled:opacity-50 hover:bg-purple-700 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> Ask Question
                            </button>
                        </div>
                    </form>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                    <AnimatePresence mode='popLayout'>
                        {filteredQuestions.length > 0 ? (
                            filteredQuestions.map((q) => (
                                <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    className={`bg-white rounded-2xl shadow-sm border-2 p-6 relative overflow-hidden ${q.status === 'answered'
                                        ? 'border-green-200 bg-gradient-to-br from-white to-green-50/30'
                                        : 'border-purple-200 bg-gradient-to-br from-white to-purple-50/30'
                                        }`}
                                >
                                    {/* Status Badge */}
                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${q.status === 'answered'
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-orange-100 text-orange-600'
                                        }`}>
                                        {q.status === 'answered' ? '✓ Answered' : '⏳ Waiting'}
                                    </div>

                                    {/* Question */}
                                    <div className="mb-4 pr-24">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 text-purple-600 font-bold">
                                                Q
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-lg text-gray-800 font-medium leading-relaxed">
                                                    {q.question}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                    <span className="font-semibold text-purple-600">{q.askedByName}</span>
                                                    <span>•</span>
                                                    <span>{new Date(q.askedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Answer Section */}
                                    {q.status === 'answered' && q.answer ? (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-600 font-bold">
                                                    A
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-base text-gray-700 leading-relaxed">
                                                        {q.answer}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <span className="font-semibold text-green-600">{q.answeredByName}</span>
                                                        <span>•</span>
                                                        <span>{q.answeredAt && new Date(q.answeredAt).toLocaleDateString()}</span>
                                                        {isAdmin && (
                                                            <>
                                                                <span>•</span>
                                                                <button
                                                                    onClick={() => handleDeleteAnswer(q.id)}
                                                                    className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
                                                                    title="Delete Answer Only"
                                                                >
                                                                    <Trash2 size={12} />
                                                                    <span className="text-[10px] font-semibold">Delete Answer</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            {answeringId === q.id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={answerText}
                                                        onChange={(e) => setAnswerText(e.target.value)}
                                                        placeholder="Write your answer..."
                                                        className="w-full p-3 bg-green-50 rounded-xl outline-none resize-none focus:ring-2 focus:ring-green-200 transition-all min-h-[80px]"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAnswer(q.id)}
                                                            disabled={!answerText.trim()}
                                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            <Send size={16} /> Submit Answer
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setAnsweringId(null);
                                                                setAnswerText('');
                                                            }}
                                                            className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setAnsweringId(q.id)}
                                                    className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-semibold transition-all border-2 border-dashed border-purple-200"
                                                >
                                                    💬 Answer this question
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Delete Button (Admin Only) */}
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            className="absolute bottom-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2"
                                            title="Delete Question"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-16 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl">
                                <MessageCircleQuestion size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-bold text-gray-600 mb-2">No Questions Yet</h3>
                                <p className="text-gray-400">Be brave, ask the first question! 💭</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default QuestionWall;
