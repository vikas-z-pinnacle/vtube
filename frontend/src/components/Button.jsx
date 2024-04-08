import PropTypes from 'prop-types'; // Import PropTypes

export default function Button({
    children,
    type = "button",
    bgColor = "bg-blue-600",
    textColor = "text-white",
    className = "",
    ...props
}) {
    return (
        <button type={type} className={`px-4 py-2 rounded-lg ${bgColor} ${textColor} ${className}`} {...props}>
            {children}
        </button>
    );
}

// PropTypes validation
Button.propTypes = {
    children: PropTypes.node.isRequired, // Ensure children is required and can be any node
    type: PropTypes.string,
    bgColor: PropTypes.string,
    textColor: PropTypes.string,
    className: PropTypes.string
};
