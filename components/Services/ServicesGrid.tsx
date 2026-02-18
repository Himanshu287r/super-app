"use client";

import { useRouter } from 'next/navigation';
import { MapPin, ShoppingBag, Gamepad2, BookOpen, Sparkles, Car, Building2, UtensilsCrossed, Landmark } from 'lucide-react';
import styles from './ServicesGrid.module.css';

interface Service {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    route?: string;
}

const services: Service[] = [
    { id: 'maps', name: 'Maps', icon: <MapPin size={24} />, color: '#3b82f6', route: '/services/maps' },
    { id: 'shop', name: 'Shop', icon: <ShoppingBag size={24} />, color: '#10b981' },
    { id: 'games', name: 'Games', icon: <Gamepad2 size={24} />, color: '#8b5cf6' },
    { id: 'learning', name: 'Learning', icon: <BookOpen size={24} />, color: '#f59e0b' },
    { id: 'ai', name: 'AI Assistant', icon: <Sparkles size={24} />, color: '#ec4899' },
    { id: 'rides', name: 'Rides', icon: <Car size={24} />, color: '#ef4444' },
    { id: 'hotels', name: 'Hotels', icon: <Building2 size={24} />, color: '#06b6d4' },
    { id: 'food', name: 'Food', icon: <UtensilsCrossed size={24} />, color: '#f97316' },
    { id: 'bank', name: 'Bank', icon: <Landmark size={24} />, color: '#6366f1' },
];

export default function ServicesGrid() {
    const router = useRouter();

    const handleServiceClick = (service: Service) => {
        if (service.route) {
            router.push(service.route);
        } else {
            console.log(`Service clicked: ${service.id}`);
            // You can add navigation or modal logic here for other services
        }
    };

    return (
        <div className={styles.servicesContainer}>
            <div className={styles.servicesGrid}>
                {services.map((service) => (
                    <div
                        key={service.id}
                        className={styles.serviceCard}
                        onClick={() => handleServiceClick(service)}
                    >
                        <div
                            className={styles.serviceIcon}
                            style={{ backgroundColor: `${service.color}15`, color: service.color }}
                        >
                            {service.icon}
                        </div>
                        <span className={styles.serviceName}>{service.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
