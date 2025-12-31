'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Trash2, Plus, X, Users, Database, Star, FileQuestion, AlertCircle, Filter } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import AdminNavbar from '@/components/navigation/AdminNavbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import DataTable, { Column } from '@/components/admin/DataTable';
import Pagination from '@/components/admin/Pagination';
import SearchBar from '@/components/admin/SearchBar';
import { Button } from '@/components/ui/button';
import { ToastContainer } from '@/components/admin/Toast';
import { useToast } from '@/hooks/useToast';

type TabType = 'users' | 'domains' | 'skills' | 'questions';

export default function AdminManagePage() {
    const [activeTab, setActiveTab] = useState<TabType>('domains');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    // Sorting
    const [sortKey, setSortKey] = useState('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Data states
    const [users, setUsers] = useState<any[]>([]);
    const [domains, setDomains] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [questions, setQuestions] = useState<any[]>([]);

    // Filter states
    const [roleFilter, setRoleFilter] = useState('');
    const [domainFilter, setDomainFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState<any>({});

    // Question creation specific states
    const [selectedDomainForSkill, setSelectedDomainForSkill] = useState('');
    const [filteredSkillsForCreate, setFilteredSkillsForCreate] = useState<any[]>([]);
    const [distractors, setDistractors] = useState<string[]>(['', '', '']);
    const [uploadingAssets, setUploadingAssets] = useState(false);
    const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');
    const [uploadedImageUrls, setUploadedImageUrls] = useState<Record<string, string>>({});

    // Load domains and skills once on component mount (needed for dropdowns)
    useEffect(() => {
        loadDomainsAndSkills();
    }, []);

    // Load data when tab or filters change
    useEffect(() => {
        setCurrentPage(1);
        loadData();
    }, [activeTab, searchQuery, roleFilter, domainFilter, difficultyFilter]);

    // Load data when pagination or sorting changes
    useEffect(() => {
        loadData();
    }, [currentPage, pageSize, sortKey, sortDirection]);

    // Filter skills by selected domain for question creation
    useEffect(() => {
        if (selectedDomainForSkill && skills.length > 0) {
            const filtered = skills.filter((s: any) => s.domainId === selectedDomainForSkill);
            setFilteredSkillsForCreate(filtered);
        } else {
            setFilteredSkillsForCreate([]);
        }
    }, [selectedDomainForSkill, skills]);

    // Load domains and skills once (needed for dropdowns across all tabs)
    const loadDomainsAndSkills = async () => {
        try {
            const [domainsData, skillsData] = await Promise.all([
                ApiClient.getAllDomains(),
                ApiClient.getAllSkills()
            ]);
            setDomains(domainsData);
            setSkills(skillsData);
        } catch (error) {
            console.error('Error loading domains and skills:', error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'users':
                    const usersData = await ApiClient.getAllUsers({
                        page: currentPage,
                        pageSize,
                        search: searchQuery,
                        role: roleFilter
                    });
                    setUsers(usersData.users || []);
                    setTotalItems(usersData.total || 0);
                    break;
                case 'domains':
                    // Domains already loaded, just filter
                    let filteredDomains = domains;
                    if (searchQuery) {
                        filteredDomains = domains.filter((d: any) =>
                            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.code.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    }
                    setTotalItems(filteredDomains.length);
                    break;
                case 'skills':
                    // Skills already loaded, just filter
                    let filteredSkills = skills;
                    if (searchQuery) {
                        filteredSkills = skills.filter((s: any) =>
                            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.code.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    }
                    if (domainFilter) {
                        filteredSkills = filteredSkills.filter((s: any) => s.domainId === domainFilter);
                    }
                    setTotalItems(filteredSkills.length);
                    break;
                case 'questions':
                    const questionsData = await ApiClient.getAllQuestions({
                        page: currentPage,
                        pageSize,
                        search: searchQuery,
                        difficulty: difficultyFilter ? parseInt(difficultyFilter) : undefined
                    });
                    setQuestions(questionsData.questions || []);
                    setTotalItems(questionsData.total || 0);
                    break;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string, direction: 'asc' | 'desc') => {
        setSortKey(key);
        setSortDirection(direction);
    };

    const handleCreate = () => {
        setFormData({});
        setSelectedDomainForSkill('');
        setDistractors(['', '', '']);
        setUploadedAudioUrl('');
        setUploadedImageUrls({});
        setShowCreateModal(true);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setFormData(item);
        setShowEditModal(true);
    };

    const handleDelete = (item: any) => {
        setSelectedItem(item);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;

        try {
            switch (activeTab) {
                case 'users':
                    await ApiClient.deleteUser(selectedItem.id);
                    break;
                case 'domains':
                    await ApiClient.deleteDomain(selectedItem.id);
                    break;
                case 'skills':
                    await ApiClient.deleteSkill(selectedItem.id);
                    break;
                case 'questions':
                    await ApiClient.deleteQuestion(selectedItem.id);
                    break;
            }
            toast.success(`Successfully deleted ${selectedItem.name || selectedItem.promptText}`);
            setShowDeleteModal(false);
            setSelectedItem(null);
            loadData();
        } catch (error: any) {
            console.error('Error deleting:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleSubmitCreate = async () => {
        try {
            switch (activeTab) {
                case 'users':
                    await ApiClient.createUser(formData);
                    break;
                case 'domains':
                    await ApiClient.createDomain(formData);
                    break;
                case 'skills':
                    await ApiClient.createSkill(formData);
                    break;
                case 'questions':
                    // Prepare question data
                    const questionData = {
                        microSkillId: formData.microSkillId,
                        difficultyLevel: parseInt(formData.difficultyLevel),
                        promptText: formData.promptText,
                        correctAnswer: formData.correctAnswer,
                        distractors: distractors.filter(d => d.trim() !== ''),
                        hasConfusingDistractors: formData.hasConfusingDistractors || false,
                        promptAudioUrl: uploadedAudioUrl || undefined,
                        assetUrls: Object.keys(uploadedImageUrls).length > 0 ? uploadedImageUrls : undefined
                    };
                    await ApiClient.createQuestion(questionData);
                    break;
            }
            toast.success(`Successfully created ${formData.name || formData.promptText || 'item'}`);
            setShowCreateModal(false);
            setFormData({});
            loadData();
        } catch (error: any) {
            console.error('Error creating:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create. Please try again.';
            toast.error(errorMessage);
        }
    };

    const handleSubmitEdit = async () => {
        if (!selectedItem) return;

        try {
            switch (activeTab) {
                case 'users':
                    await ApiClient.updateUser(selectedItem.id, formData);
                    break;
                case 'domains':
                    await ApiClient.updateDomain(selectedItem.id, formData);
                    break;
                case 'skills':
                    await ApiClient.updateSkill(selectedItem.id, formData);
                    break;
                case 'questions':
                    await ApiClient.updateQuestion(selectedItem.id, formData);
                    break;
            }
            toast.success(`Successfully updated ${formData.name || selectedItem.name || 'item'}`);
            setShowEditModal(false);
            setSelectedItem(null);
            setFormData({});
            loadData();
        } catch (error: any) {
            console.error('Error updating:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update. Please try again.';
            toast.error(errorMessage);
        }
    };

    // Asset upload handlers
    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('audio/')) {
            toast.error('Please upload an audio file');
            return;
        }

        setUploadingAssets(true);
        try {
            const result = await ApiClient.uploadAsset(file, 'audio', 'questions');
            setUploadedAudioUrl(result.url);
            toast.success('Audio uploaded successfully');
        } catch (error) {
            console.error('Error uploading audio:', error);
            toast.error('Failed to upload audio');
        } finally {
            setUploadingAssets(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingAssets(true);
        try {
            const uploadPromises = Array.from(files).map(async (file, index) => {
                if (!file.type.startsWith('image/')) {
                    throw new Error(`${file.name} is not an image file`);
                }
                const result = await ApiClient.uploadAsset(file, 'images', 'questions');
                return { key: `image_${index}`, url: result.url };
            });

            const results = await Promise.all(uploadPromises);
            const imageUrls: Record<string, string> = {};
            results.forEach(({ key, url }) => {
                imageUrls[key] = url;
            });

            setUploadedImageUrls(imageUrls);
            toast.success(`${results.length} image(s) uploaded successfully`);
        } catch (error: any) {
            console.error('Error uploading images:', error);
            toast.error(error.message || 'Failed to upload images');
        } finally {
            setUploadingAssets(false);
        }
    };

    const handleDistractorChange = (index: number, value: string) => {
        const newDistractors = [...distractors];
        newDistractors[index] = value;
        setDistractors(newDistractors);
    };

    const addDistractor = () => {
        setDistractors([...distractors, '']);
    };

    const removeDistractor = (index: number) => {
        if (distractors.length > 1) {
            setDistractors(distractors.filter((_, i) => i !== index));
        }
    };

    const tabs = [
        { id: 'users' as TabType, label: 'Users', icon: Users },
        { id: 'domains' as TabType, label: 'Domains', icon: Database },
        { id: 'skills' as TabType, label: 'Skills', icon: Star },
        { id: 'questions' as TabType, label: 'Questions', icon: FileQuestion },
    ];

    // Column definitions
    const userColumns: Column<any>[] = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        {
            key: 'role', header: 'Role', sortable: true, render: (user) => (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                </span>
            )
        },
        {
            key: 'createdAt', header: 'Created', sortable: true, render: (user) =>
                new Date(user.createdAt).toLocaleDateString()
        },
        {
            key: 'actions', header: 'Actions', render: (user) => (
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(user)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(user)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            )
        }
    ];

    const domainColumns: Column<any>[] = [
        { key: 'code', header: 'Code', sortable: true, width: '100px' },
        { key: 'name', header: 'Name', sortable: true },
        {
            key: 'description', header: 'Description', render: (domain) => (
                <span className="line-clamp-1">{domain.description || '-'}</span>
            )
        },
        { key: 'skills', header: 'Skills', render: (domain) => domain.microSkills?.length || 0 },
        {
            key: 'actions', header: 'Actions', render: (domain) => (
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(domain)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(domain)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            )
        }
    ];

    const skillColumns: Column<any>[] = [
        { key: 'code', header: 'Code', sortable: true, width: '120px' },
        { key: 'name', header: 'Name', sortable: true },
        { key: 'domain', header: 'Domain', render: (skill) => skill.domain?.name || '-' },
        { key: 'gameTemplate', header: 'Template', sortable: true },
        {
            key: 'actions', header: 'Actions', render: (skill) => (
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(skill)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(skill)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            )
        }
    ];

    const questionColumns: Column<any>[] = [
        {
            key: 'promptText', header: 'Question', render: (q) => (
                <span className="line-clamp-2">{q.promptText}</span>
            )
        },
        { key: 'microSkillId', header: 'Skill', render: (q) => q.microSkill?.name || '-' },
        {
            key: 'difficultyLevel', header: 'Difficulty', sortable: true, render: (q) => (
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${q.difficultyLevel === 1 ? 'bg-green-100 text-green-800' :
                    q.difficultyLevel === 2 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                    Level {q.difficultyLevel}
                </span>
            )
        },
        {
            key: 'actions', header: 'Actions', render: (question) => (
                <div className="flex gap-2">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleEdit(question)}
                        className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Edit"
                    >
                        <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(question)}
                        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </motion.button>
                </div>
            )
        }
    ];

    const getCurrentData = () => {
        switch (activeTab) {
            case 'users': return users;
            case 'domains': return domains.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            case 'skills': return skills.slice((currentPage - 1) * pageSize, currentPage * pageSize);
            case 'questions': return questions;
            default: return [];
        }
    };

    const getCurrentColumns = () => {
        switch (activeTab) {
            case 'users': return userColumns;
            case 'domains': return domainColumns;
            case 'skills': return skillColumns;
            case 'questions': return questionColumns;
            default: return [];
        }
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminNavbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 pt-20 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-2">Data Management</h1>
                        <p className="text-lg text-slate-600">Manage users, domains, skills, and questions</p>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-base ${isActive
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Toolbar */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex-1 max-w-md">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder={`Search ${activeTab}...`}
                            />
                        </div>
                        <div className="flex gap-2">
                            {activeTab === 'users' && (
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Roles</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="EDUCATOR">Educator</option>
                                    <option value="PARENT">Parent</option>
                                    <option value="CHILD">Child</option>
                                </select>
                            )}
                            {activeTab === 'skills' && (
                                <select
                                    value={domainFilter}
                                    onChange={(e) => setDomainFilter(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Domains</option>
                                    {domains.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            )}
                            {activeTab === 'questions' && (
                                <select
                                    value={difficultyFilter}
                                    onChange={(e) => setDifficultyFilter(e.target.value)}
                                    className="border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Difficulties</option>
                                    <option value="1">Level 1</option>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                </select>
                            )}
                            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create {activeTab.slice(0, -1)}
                            </Button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <DataTable
                        columns={getCurrentColumns()}
                        data={getCurrentData()}
                        loading={loading}
                        onSort={handleSort}
                        currentSort={sortKey ? { key: sortKey, direction: sortDirection } : undefined}
                    />

                    {/* Pagination */}
                    {totalItems > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            pageSize={pageSize}
                            totalItems={totalItems}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className={`bg-white rounded-lg p-6 w-full ${activeTab === 'questions' ? 'max-w-6xl max-h-[90vh] overflow-y-auto' : 'max-w-4xl'}`}>
                        <h3 className="text-lg font-bold mb-4">Create {activeTab.slice(0, -1)}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Form Column */}
                            <div>
                                {/* Form fields based on activeTab */}
                                {activeTab === 'domains' && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Code"
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full mb-3 px-3 py-2 border rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full mb-3 px-3 py-2 border rounded"
                                        />
                                        <textarea
                                            placeholder="Description"
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full mb-3 px-3 py-2 border rounded"
                                            rows={3}
                                        />
                                    </>
                                )}
                                {activeTab === 'skills' && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Code"
                                            value={formData.code || ''}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full mb-3 px-3 py-2 border rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Name"
                                            value={formData.name || ''}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full mb-3 px-3 py-2 border rounded"
                                        />
                                        <select
                                            value={formData.domainId || ''}
                                            onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                                            className="w-full mb-3 px-3 py-2 border rounded"
                                        >
                                            <option value="">Select Domain</option>
                                            {domains.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                                {activeTab === 'questions' && (
                                    <>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                                            <select
                                                value={selectedDomainForSkill}
                                                onChange={(e) => {
                                                    setSelectedDomainForSkill(e.target.value);
                                                    setFormData({ ...formData, microSkillId: '' });
                                                }}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            >
                                                <option value="">Select Domain</option>
                                                {domains.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                                            <select
                                                value={formData.microSkillId || ''}
                                                onChange={(e) => setFormData({ ...formData, microSkillId: e.target.value })}
                                                className="w-full px-3 py-2 border rounded"
                                                disabled={!selectedDomainForSkill}
                                                required
                                            >
                                                <option value="">Select Skill</option>
                                                {filteredSkillsForCreate.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Game Template</label>
                                            <select
                                                value={formData.gameTemplate || 'TAP_SELECT'}
                                                onChange={(e) => setFormData({ ...formData, gameTemplate: e.target.value })}
                                                className="w-full px-3 py-2 border rounded"
                                            >
                                                <option value="TAP_SELECT">Tap & Select</option>
                                                <option value="DRAG_DROP">Drag & Drop</option>
                                                <option value="SORTING">Sorting</option>
                                                <option value="PICTURE_TO_WORD">Picture to Word</option>
                                                <option value="AUDIO_TO_LETTER">Audio to Letter</option>
                                                <option value="PUZZLE_JOIN">Puzzle Join</option>
                                                <option value="MEMORY_CARD">Memory Card</option>
                                                <option value="FIND_THE_WORD">Find the Word</option>
                                                <option value="SEQUENCING">Sequencing</option>
                                                <option value="ODD_ONE_OUT">Odd One Out</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                            <textarea
                                                placeholder="Enter the question text"
                                                value={formData.promptText || ''}
                                                onChange={(e) => setFormData({ ...formData, promptText: e.target.value })}
                                                className="w-full px-3 py-2 border rounded"
                                                rows={3}
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                                            <input
                                                type="text"
                                                placeholder="Enter the correct answer"
                                                value={formData.correctAnswer || ''}
                                                onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Distractors (Wrong Answers)</label>
                                            {distractors.map((distractor, index) => (
                                                <div key={index} className="flex gap-2 mb-2">
                                                    <input
                                                        type="text"
                                                        placeholder={`Distractor ${index + 1}`}
                                                        value={distractor}
                                                        onChange={(e) => handleDistractorChange(index, e.target.value)}
                                                        className="flex-1 px-3 py-2 border rounded"
                                                    />
                                                    {distractors.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeDistractor(index)}
                                                            className="px-3 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addDistractor}
                                                className="text-sm text-blue-600 hover:text-blue-700"
                                            >
                                                + Add Distractor
                                            </button>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                                            <select
                                                value={formData.difficultyLevel || '1'}
                                                onChange={(e) => setFormData({ ...formData, difficultyLevel: e.target.value })}
                                                className="w-full px-3 py-2 border rounded"
                                                required
                                            >
                                                <option value="1">Level 1 (Easy)</option>
                                                <option value="2">Level 2 (Medium)</option>
                                                <option value="3">Level 3 (Hard)</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.hasConfusingDistractors || false}
                                                    onChange={(e) => setFormData({ ...formData, hasConfusingDistractors: e.target.checked })}
                                                    className="rounded"
                                                />
                                                <span className="text-sm text-gray-700">Has confusing distractors</span>
                                            </label>
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Prompt Audio (Optional)
                                            </label>
                                            <input
                                                type="file"
                                                accept="audio/*"
                                                onChange={handleAudioUpload}
                                                className="w-full px-3 py-2 border rounded"
                                                disabled={uploadingAssets}
                                            />
                                            {uploadedAudioUrl && (
                                                <p className="text-xs text-green-600 mt-1">✓ Audio uploaded</p>
                                            )}
                                        </div>
                                        <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Images (Optional)
                                            </label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="w-full px-3 py-2 border rounded"
                                                disabled={uploadingAssets}
                                            />
                                            {Object.keys(uploadedImageUrls).length > 0 && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    ✓ {Object.keys(uploadedImageUrls).length} image(s) uploaded
                                                </p>
                                            )}
                                        </div>
                                        {uploadingAssets && (
                                            <p className="text-sm text-blue-600 mb-3">Uploading assets...</p>
                                        )}
                                    </>
                                )}
                                <div className="flex gap-2 justify-end mt-4">
                                    <Button onClick={() => setShowCreateModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleSubmitCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        Create
                                    </Button>
                                </div>
                            </div>
                            {/* Existing Items Column */}
                            <div className="border-l pl-6">
                                <h4 className="font-semibold text-gray-700 mb-3">Existing {activeTab}</h4>
                                <div className="max-h-96 overflow-y-auto space-y-2">
                                    {activeTab === 'domains' && domains.map(d => (
                                        <div key={d.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                                            <div className="font-semibold text-sm">{d.name}</div>
                                            <div className="text-xs text-gray-600">Code: {d.code}</div>
                                            <div className="text-xs text-gray-500 mt-1">{d.description || 'No description'}</div>
                                            <div className="text-xs text-blue-600 mt-1">{d.microSkills?.length || 0} skills</div>
                                        </div>
                                    ))}
                                    {activeTab === 'skills' && skills.map(s => (
                                        <div key={s.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                                            <div className="font-semibold text-sm">{s.name}</div>
                                            <div className="text-xs text-gray-600">Code: {s.code}</div>
                                            <div className="text-xs text-gray-500 mt-1">Domain: {s.domain?.name || 'N/A'}</div>
                                        </div>
                                    ))}
                                    {activeTab === 'users' && users.map(u => (
                                        <div key={u.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                                            <div className="font-semibold text-sm">{u.name}</div>
                                            <div className="text-xs text-gray-600">{u.email}</div>
                                            <div className="text-xs text-gray-500 mt-1">Role: {u.role}</div>
                                        </div>
                                    ))}
                                    {activeTab === 'questions' && questions.slice(0, 10).map(q => (
                                        <div key={q.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                                            <div className="font-semibold text-sm line-clamp-2">{q.promptText}</div>
                                            <div className="text-xs text-gray-600 mt-1">Skill: {q.microSkill?.name || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">Difficulty: Level {q.difficultyLevel}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedItem && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Edit {activeTab.slice(0, -1)}</h3>
                        {activeTab === 'users' && (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-700 mb-2">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm text-slate-700 mb-2">Role</label>
                                    <select
                                        value={formData.role || ''}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                        <option value="">Select Role</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="TEACHER">Teacher</option>
                                        <option value="CHILD">Child</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {activeTab === 'domains' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full mb-3 px-3 py-2 border rounded"
                                />
                                <textarea
                                    placeholder="Description"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full mb-3 px-3 py-2 border rounded"
                                    rows={3}
                                />
                            </>
                        )}
                        {activeTab === 'skills' && (
                            <>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full mb-3 px-3 py-2 border rounded"
                                />
                                <select
                                    value={formData.domainId || ''}
                                    onChange={(e) => setFormData({ ...formData, domainId: e.target.value })}
                                    className="w-full mb-3 px-3 py-2 border rounded"
                                >
                                    <option value="">Select Domain</option>
                                    {domains.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        {activeTab === 'questions' && (
                            <>
                                <select
                                    value={formData.difficultyLevel || ''}
                                    onChange={(e) => setFormData({ ...formData, difficultyLevel: parseInt(e.target.value) })}
                                    className="w-full mb-3 px-3 py-2 border rounded"
                                >
                                    <option value="">Select Difficulty</option>
                                    <option value="1">Level 1</option>
                                    <option value="2">Level 2</option>
                                    <option value="3">Level 3</option>
                                </select>
                            </>
                        )}
                        <div className="flex gap-2 justify-end mt-6">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmitEdit}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-lg transition-all shadow-lg"
                            >
                                Save Changes
                            </motion.button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedItem && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Confirm Delete</h3>
                                <p className="text-sm text-gray-600">This action cannot be undone</p>
                            </div>
                        </div>
                        <p className="mb-6">
                            Are you sure you want to delete <strong>{selectedItem.name || selectedItem.promptText}</strong>?
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button onClick={() => setShowDeleteModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
                                Cancel
                            </Button>
                            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer toasts={toast.toasts} onClose={toast.clearToast} />
        </ProtectedRoute>
    );
}
