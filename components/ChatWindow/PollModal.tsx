"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './PollModal.module.css';

interface PollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreatePoll: (question: string, options: string[]) => void;
}

export default function PollModal({ isOpen, onClose, onCreatePoll }: PollModalProps) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    if (!isOpen) return null;

    const handleAddOption = () => {
        if (options.length < 10) {
            setOptions([...options, '']);
        }
    };

    const handleRemoveOption = (index: number) => {
        if (options.length > 2) {
            setOptions(options.filter((_, i) => i !== index));
        }
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreate = () => {
        const trimmedQuestion = question.trim();
        const trimmedOptions = options.map(opt => opt.trim()).filter(opt => opt.length > 0);

        if (trimmedQuestion.length === 0) {
            alert('Please enter a question');
            return;
        }

        if (trimmedOptions.length < 2) {
            alert('Please add at least 2 options');
            return;
        }

        onCreatePoll(trimmedQuestion, trimmedOptions);
        setQuestion('');
        setOptions(['', '']);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 className={styles.title}>Create Poll</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.field}>
                        <label className={styles.label}>Question</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Options</label>
                        <div className={styles.optionsList}>
                            {options.map((option, index) => (
                                <div key={index} className={styles.optionRow}>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            className={styles.removeButton}
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {options.length < 10 && (
                            <button className={styles.addButton} onClick={handleAddOption}>
                                + Add Option
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button className={styles.createButton} onClick={handleCreate}>
                        Create Poll
                    </button>
                </div>
            </div>
        </>
    );
}
