"use client";

import { BarChart3 } from 'lucide-react';
import { MessageDoc } from '@/lib/services/messageService';
import { voteOnPoll } from '@/lib/services/messageService';
import styles from './PollMessage.module.css';

interface PollMessageProps {
    message: MessageDoc;
    chatId: string;
    currentUserId: string;
}

export default function PollMessage({ message, chatId, currentUserId }: PollMessageProps) {
    if (message.type !== 'poll' || !message.pollQuestion || !message.pollOptions) {
        return null;
    }

    const handleVote = async (optionIndex: number) => {
        try {
            await voteOnPoll(chatId, message.id, optionIndex, currentUserId);
        } catch (error) {
            console.error('Failed to vote:', error);
        }
    };

    const getTotalVotes = () => {
        return message.pollOptions!.reduce((sum, opt) => sum + opt.votes.length, 0);
    };

    const hasUserVoted = (optionIndex: number) => {
        return message.pollOptions![optionIndex].votes.includes(currentUserId);
    };

    const getVotePercentage = (votes: number) => {
        const total = getTotalVotes();
        return total > 0 ? Math.round((votes / total) * 100) : 0;
    };

    const totalVotes = getTotalVotes();

    return (
        <div className={styles.pollContainer}>
            <div className={styles.pollHeader}>
                <BarChart3 size={20} />
                <span className={styles.pollLabel}>Poll</span>
            </div>
            <h4 className={styles.question}>{message.pollQuestion}</h4>
            <div className={styles.options}>
                {message.pollOptions.map((option, index) => {
                    const votes = option.votes.length;
                    const percentage = getVotePercentage(votes);
                    const voted = hasUserVoted(index);

                    return (
                        <button
                            key={index}
                            className={`${styles.option} ${voted ? styles.voted : ''}`}
                            onClick={() => handleVote(index)}
                        >
                            <div className={styles.optionContent}>
                                <span className={styles.optionText}>{option.text}</span>
                                <span className={styles.voteCount}>
                                    {votes} {votes === 1 ? 'vote' : 'votes'}
                                </span>
                            </div>
                            {totalVotes > 0 && (
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            )}
                            {voted && <span className={styles.checkmark}>✓</span>}
                        </button>
                    );
                })}
            </div>
            <div className={styles.footer}>
                {totalVotes > 0 ? (
                    <span className={styles.totalVotes}>{totalVotes} total votes</span>
                ) : (
                    <span className={styles.noVotes}>No votes yet</span>
                )}
            </div>
        </div>
    );
}
