import React from 'react';

interface PencilIconProps {
    color?: string;
    strokeWidth?: number;
}

const PencilIcon: React.FC<PencilIconProps> = ({ color = 'currentColor' }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
        <g clipPath="url(#clip0_3651_11836)">
            <path fillRule="evenodd" clipRule="evenodd" d="M16.5208 0.762423C17.5327 -0.254141 19.1606 -0.254141 20.1725 0.762423L22.8509 3.48261C23.9257 4.56243 23.9258 6.36769 22.851 7.44752L8.17912 22.1897C8.02968 22.34 7.84691 22.4437 7.64941 22.4903L1.38193 23.9721C0.994537 24.0636 0.591859 23.927 0.317753 23.6108C0.0436473 23.2946 -0.0627845 22.8442 0.0364799 22.4203L1.51118 16.1229C1.56691 15.8849 1.68424 15.6701 1.84881 15.5048L16.5208 0.762423ZM18.0582 2.63191L3.63857 17.1206L2.71281 21.0739L6.86975 20.0912L21.3133 5.57811C21.3427 5.54885 21.3563 5.52392 21.3626 5.50802C21.3693 5.49153 21.3714 5.47727 21.3714 5.46511C21.3714 5.45293 21.3693 5.43867 21.3626 5.42217C21.3563 5.40627 21.3427 5.38142 21.3136 5.35218L18.6351 2.63191C18.4921 2.48552 18.2198 2.48552 18.0582 2.63191Z"
                fill={color} />
        </g>
        <defs>
            <clipPath id="clip0_3651_11836">
                <rect width="24" height="24" fill="white" />
            </clipPath>
        </defs>
    </svg>
);

export default PencilIcon; 