import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminMessagePopup = () => {
    const { user, acceptMessage } = useAuth();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!user || (!user.pendingMessage && !user.pending_message)) return null;

    const messageToDisplay = user.pendingMessage || user.pending_message;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password) {
            toast.error('Password is required to acknowledge the message.');
            return;
        }

        setIsLoading(true);
        const { success, error } = await acceptMessage(password);
        setIsLoading(false);

        if (success) {
            toast.success('Message acknowledged successfully.');
            setPassword('');
        } else {
            toast.error(error || 'Failed to acknowledge message.');
            setPassword(''); // Clear password on failure for security
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm sm:p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100 flex flex-col">
                <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Important Message from Admin</h2>
                    <p className="text-sm text-gray-500">You must acknowledge this message to continue</p>
                </div>

                <div className="p-6 bg-white flex-1">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 max-h-48 overflow-y-auto">
                        <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed font-medium">
                            {messageToDisplay}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Your Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-red-500 focus:border-red-500 text-sm"
                                    placeholder="Enter password to acknowledge"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <span>I Acknowledge and Accept</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminMessagePopup;
