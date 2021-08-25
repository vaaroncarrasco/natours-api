/* eslint-disable */
import axios from 'axios'; // npm module
import { showAlert } from './alert'; // file export

// type = 'password' || 'data'
// data = {,}
export const updateSettings = async (data, type) => {
    try {
        const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe';

        // * no need to add route for updating user data cause we're using axios to send data as post to specific route for us
        const res = await axios({ method: 'PATCH', url, data });

        if (res.data.status === 'success') showAlert('success', `${type.toUpperCase()} updated successfully`);

    } catch (err) { showAlert('error', err.response.data.message); }
};