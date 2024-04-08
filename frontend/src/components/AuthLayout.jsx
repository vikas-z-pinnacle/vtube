import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'; // Import PropTypes

export default function Protected({ children, authentication = true }) {

    const navigate = useNavigate();
    const [loader, setLoader] = useState(true);
    const authStatus = useSelector(state => state.auth.status);

    useEffect(() => {
        if (authentication && authStatus !== authentication) {
            navigate("/login");
        } else if (!authentication && authStatus !== authentication) {
            navigate("/");
        }
        setLoader(false);
    }, [authStatus, navigate, authentication]);

    return loader ? <h1>Loading...</h1> : <>{children}</>;
}

// PropTypes validation
Protected.propTypes = {
    children: PropTypes.node.isRequired, // Ensure children is required and can be any node
    authentication: PropTypes.bool
};
