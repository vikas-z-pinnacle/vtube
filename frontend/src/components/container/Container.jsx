import PropTypes from 'prop-types'; // Import PropTypes

function Container({ children }) {
  return <div className='w-full max-w-7xl mx-auto px-4'>{children}</div>;
}

export default Container;

// PropTypes validation
Container.propTypes = {
  children: PropTypes.node.isRequired // Ensure children is required and can be any node
};
