'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Eye, Trash2, Filter, X, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import AdminNavbar from '@/components/navigation/AdminNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable, { Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import SearchBar from '@/components/admin/SearchBar';
import { Button } from '@/components/ui/button';

interface ExtractedQuestion {
    id: string;
    questionText: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    imageUrls: string[];
    confidence: number;
    reviewStatus: string;
    pageNumber?: number;
    skillId?: string;
    gameTemplate: string;
    difficultyLevel: number;
}

interface UploadedDocument {
    id: string;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    status: string;
    extractedQuestions: number;
    extractedImages: number;
    questions: ExtractedQuestion[];
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<UploadedDocument[]>([]);
    const [domains, setDomains] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Modals
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showQuestionsModal, setShowQuestionsModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<UploadedDocument | null>(null);

    // Question assignment
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
    const [bulkDomain, setBulkDomain] = useState('');
    const [bulkSkill, setBulkSkill] = useState('');
    const [bulkSkills, setBulkSkills] = useState<any[]>([]);

    // Question edits
    const [questionEdits, setQuestionEdits] = useState<Record<string, Partial<ExtractedQuestion>>>({});

    // Prevent duplicate API calls
    const domainsLoaded = useRef(false);

    useEffect(() => {
        loadDocuments();
        if (!domainsLoaded.current) {
            loadDomains();
            domainsLoaded.current = true;
        }
    }, []);

    useEffect(() => {
        if (bulkDomain) {
            const domainSkills = skills.filter(s => s.domainId === bulkDomain);
            setBulkSkills(domainSkills);
        } else {
            setBulkSkills([]);
        }
    }, [bulkDomain, skills]);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const data = await ApiClient.getAllDocuments(100);
            setDocuments(data);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDomains = async () => {
        try {
            const [domainsData, skillsData] = await Promise.all([
                ApiClient.getAllDomains(),
                ApiClient.getAllSkills()
            ]);
            setDomains(domainsData);
            setSkills(skillsData);
        } catch (error) {
            console.error('Error loading domains:', error);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
            alert('Please upload a PDF or DOCX file');
            return;
        }

        setUploading(true);
        setProcessing(true);
        try {
            const result = await ApiClient.uploadDocument(file);
            alert(`Document uploaded successfully! Extracted ${result.extractedQuestions} questions.`);
            setShowUploadModal(false);
            await loadDocuments();

            // Find and select the newly uploaded document
            const updatedDocs = await ApiClient.getAllDocuments(100);
            const newDoc = updatedDocs.find((d: UploadedDocument) => d.id === result.id);
            if (newDoc && newDoc.questions && newDoc.questions.length > 0) {
                setSelectedDocument(newDoc);
                setShowQuestionsModal(true);
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
            setProcessing(false);
        }
    };

    const handleBulkAssign = async () => {
        if (!bulkDomain || !bulkSkill) {
            alert('Please select both domain and skill');
            return;
        }

        if (selectedQuestions.size === 0) {
            alert('Please select at least one question');
            return;
        }

        try {
            setProcessing(true);
            const questionIds = Array.from(selectedQuestions);

            // Save all question edits first
            const editPromises = questionIds
                .filter(qId => questionEdits[qId])
                .map(qId => {
                    const edits = questionEdits[qId];
                    return ApiClient.updateExtractedQuestion(qId, edits);
                });

            if (editPromises.length > 0) {
                await Promise.all(editPromises);
            }

            // Then approve questions
            await ApiClient.bulkApproveQuestions(questionIds, bulkSkill);

            alert(`Successfully assigned ${questionIds.length} questions!`);
            setSelectedQuestions(new Set());
            setQuestionEdits({});
            setBulkDomain('');
            setBulkSkill('');
            setShowQuestionsModal(false);
            await loadDocuments();
        } catch (error) {
            console.error('Error assigning questions:', error);
            alert('Failed to assign questions');
        } finally {
            setProcessing(false);
        }
    };

    const toggleQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedQuestions);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedQuestions(newSelection);
    };

    const selectAllQuestions = () => {
        if (!selectedDocument) return;
        const pendingQuestions = selectedDocument.questions.filter(q => q.reviewStatus === 'PENDING');
        const allSelected = pendingQuestions.every(q => selectedQuestions.has(q.id));

        if (allSelected) {
            // Unselect all
            setSelectedQuestions(new Set());
        } else {
            // Select all
            setSelectedQuestions(new Set(pendingQuestions.map(q => q.id)));
        }
    };

    const updateQuestionField = (questionId: string, field: keyof ExtractedQuestion, value: any) => {
        setQuestionEdits(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                [field]: value
            }
        }));
    };

    const getQuestionValue = (question: ExtractedQuestion, field: keyof ExtractedQuestion) => {
        return questionEdits[question.id]?.[field] ?? question[field];
    };

    const filteredDocuments = documents.filter(doc => {
        const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || doc.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const paginatedDocuments = filteredDocuments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const columns: Column<UploadedDocument>[] = [
        {
            key: 'fileName',
            header: 'File Name',
            sortable: true,
            render: (doc) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span>{doc.fileName}</span>
                </div>
            )
        },
        {
            key: 'fileType',
            header: 'Type',
            sortable: true,
            width: '100px',
            render: (doc) => (
                <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
                    {doc.fileType}
                </span>
            )
        },
        {
            key: 'uploadedAt',
            header: 'Upload Date',
            sortable: true,
            render: (doc) => <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            width: '120px',
            render: (doc) => (
                <span className={`px-3 py-1 text-sm rounded-full ${doc.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    doc.status === 'PROCESSING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    {doc.status}
                </span>
            )
        },
        {
            key: 'extractedQuestions',
            header: 'Questions',
            sortable: true,
            width: '100px',
            render: (doc) => (
                <span className="text-base">{doc.extractedQuestions}</span>
            )
        },
        {
            key: 'pending',
            header: 'Pending',
            width: '100px',
            render: (doc) => {
                const pending = doc.questions?.filter(q => q.reviewStatus === 'PENDING').length || 0;
                return <span className="text-orange-600">{pending}</span>;
            }
        },
        {
            key: 'approved',
            header: 'Approved',
            width: '100px',
            render: (doc) => {
                const approved = doc.questions?.filter(q => q.reviewStatus === 'APPROVED').length || 0;
                return <span className="text-green-600">{approved}</span>;
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            width: '120px',
            render: (doc) => (
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setSelectedDocument(doc);
                            setShowQuestionsModal(true);
                        }}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Review Questions"
                    >
                        <Eye className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-5 h-5" />
                    </motion.button>
                </div>
            )
        }
    ];

    const totalPages = Math.ceil(filteredDocuments.length / pageSize);

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminNavbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">Document Management</h1>
                        <p className="text-lg text-slate-600">Upload and manage educational documents</p>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex-1 max-w-md">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search documents..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="FAILED">Failed</option>
                            </select>
                            <Button
                                onClick={() => setShowUploadModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-base px-6"
                            >
                                <Upload className="w-5 h-5 mr-2" />
                                Upload Document
                            </Button>
                        </div>
                    </div>

                    {/* Info Card */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
                        <h3 className="font-semibold text-blue-900 mb-2 text-base">Document Requirements</h3>
                        <ul className="text-base text-blue-800 space-y-1">
                            <li>• Supported formats: PDF, DOCX</li>
                            <li>• AI will automatically extract questions, options, and correct answers</li>
                            <li>• Review and assign questions to skills after extraction</li>
                        </ul>
                    </div>

                    {/* Data Table */}
                    <DataTable
                        columns={columns}
                        data={paginatedDocuments}
                        loading={loading}
                    />

                    {/* Pagination */}
                    {filteredDocuments.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={filteredDocuments.length}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h3 className="text-2xl font-semibold mb-6">Upload Document</h3>
                        <div className="mb-6">
                            <label className="block text-base font-medium text-gray-700 mb-3">
                                Select PDF or DOCX file
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.docx"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                className="w-full text-base text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-base file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        {uploading && (
                            <div className="mb-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                <p className="mt-3 text-base text-gray-600">Processing document...</p>
                            </div>
                        )}
                        <div className="flex gap-3 justify-end">
                            <Button
                                onClick={() => setShowUploadModal(false)}
                                disabled={uploading}
                                className="bg-gray-200 text-gray-800 text-base px-6"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Questions Review Modal */}
            {showQuestionsModal && selectedDocument && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-8 max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-semibold text-slate-900">Review Questions</h3>
                                <p className="text-base text-gray-600 mt-1">{selectedDocument.fileName}</p>
                            </div>
                            <button onClick={() => setShowQuestionsModal(false)}>
                                <X className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>

                        {/* Bulk Assignment */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h4 className="font-semibold text-lg text-blue-900 mb-4">Bulk Assignment</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <select
                                    value={bulkDomain}
                                    onChange={(e) => setBulkDomain(e.target.value)}
                                    className="border border-gray-300 rounded-md px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Domain</option>
                                    {domains.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={bulkSkill}
                                    onChange={(e) => setBulkSkill(e.target.value)}
                                    disabled={!bulkDomain}
                                    className="border border-gray-300 rounded-md px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                                >
                                    <option value="">Select Skill</option>
                                    {bulkSkills.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <Button
                                    onClick={handleBulkAssign}
                                    disabled={!bulkDomain || !bulkSkill || selectedQuestions.size === 0 || processing}
                                    className="bg-green-600 hover:bg-green-700 text-white text-base"
                                >
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Assign Selected ({selectedQuestions.size})
                                </Button>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={selectAllQuestions}
                                    className="text-blue-600 hover:text-blue-800 font-medium text-base"
                                >
                                    {selectedDocument.questions.filter(q => q.reviewStatus === 'PENDING').every(q => selectedQuestions.has(q.id)) && selectedQuestions.size > 0
                                        ? 'Unselect All'
                                        : 'Select All Pending Questions'}
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="space-y-4">
                            {selectedDocument.questions && selectedDocument.questions.length > 0 ? (
                                selectedDocument.questions.map((question, index) => {
                                    const currentDifficulty = getQuestionValue(question, 'difficultyLevel') as number;
                                    const currentQuestionText = getQuestionValue(question, 'questionText') as string;
                                    const currentExplanation = getQuestionValue(question, 'explanation') as string | undefined;
                                    const currentOptions = getQuestionValue(question, 'options') as string[];
                                    const currentCorrectAnswer = getQuestionValue(question, 'correctAnswer') as string;

                                    return (
                                        <div
                                            key={question.id}
                                            className={`border-2 rounded-lg p-5 ${question.reviewStatus === 'APPROVED' ? 'border-green-300 bg-green-50' :
                                                selectedQuestions.has(question.id) ? 'border-blue-500 bg-blue-50' :
                                                    'border-gray-200 bg-white'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestions.has(question.id)}
                                                    onChange={() => toggleQuestionSelection(question.id)}
                                                    disabled={question.reviewStatus === 'APPROVED'}
                                                    className="mt-1 w-5 h-5"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h5 className="font-semibold text-lg text-gray-900">Question {index + 1}</h5>
                                                        <div className="flex items-center gap-2">
                                                            {question.reviewStatus === 'APPROVED' && (
                                                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1">
                                                                    <Check className="w-4 h-4" />
                                                                    Approved
                                                                </span>
                                                            )}
                                                            <select
                                                                value={currentDifficulty}
                                                                onChange={(e) => updateQuestionField(question.id, 'difficultyLevel', parseInt(e.target.value))}
                                                                disabled={question.reviewStatus === 'APPROVED'}
                                                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value={1}>Difficulty: 1</option>
                                                                <option value={2}>Difficulty: 2</option>
                                                                <option value={3}>Difficulty: 3</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Editable Question Text */}
                                                    <textarea
                                                        value={currentQuestionText}
                                                        onChange={(e) => updateQuestionField(question.id, 'questionText', e.target.value)}
                                                        disabled={question.reviewStatus === 'APPROVED'}
                                                        className="w-full text-base text-gray-800 mb-3 font-medium p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:border-transparent"
                                                        rows={2}
                                                    />

                                                    {/* Editable Options */}
                                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                                        {currentOptions.map((option, idx) => (
                                                            <div key={idx} className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const newOptions = [...currentOptions];
                                                                        newOptions[idx] = e.target.value;
                                                                        updateQuestionField(question.id, 'options', newOptions);
                                                                    }}
                                                                    disabled={question.reviewStatus === 'APPROVED'}
                                                                    className={`w-full p-3 rounded-md text-base ${option === currentCorrectAnswer
                                                                        ? 'bg-green-100 border-2 border-green-500 font-semibold'
                                                                        : 'bg-gray-50 border border-gray-200'
                                                                        } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50`}
                                                                />
                                                                {question.reviewStatus !== 'APPROVED' && (
                                                                    <button
                                                                        onClick={() => updateQuestionField(question.id, 'correctAnswer', option)}
                                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded ${option === currentCorrectAnswer
                                                                            ? 'bg-green-600 text-white'
                                                                            : 'bg-gray-300 text-gray-700 hover:bg-green-500 hover:text-white'
                                                                            }`}
                                                                        title="Mark as correct answer"
                                                                    >
                                                                        ✓
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Editable Hint/Explanation */}
                                                    <div className="mb-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Hint/Explanation (Optional)
                                                        </label>
                                                        <textarea
                                                            value={currentExplanation || ''}
                                                            onChange={(e) => updateQuestionField(question.id, 'explanation', e.target.value)}
                                                            disabled={question.reviewStatus === 'APPROVED'}
                                                            placeholder="Add a hint or explanation for this question..."
                                                            className="w-full text-sm text-gray-600 italic p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:border-transparent"
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg text-gray-600">No questions found in this document</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Button
                                onClick={() => setShowQuestionsModal(false)}
                                className="cursor-pointer bg-white border hover:bg-gray-100 text-gray-800 text-base px-6"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
}
