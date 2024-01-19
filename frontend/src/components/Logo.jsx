import PropTypes from 'prop-types';

function Logo({ src, alt }) {
  return (
    <div className="flex items-center">
      <img src={src} alt={alt} className="h-8 w-8" />
    </div>
  )
}

Logo.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
};

export default Logo