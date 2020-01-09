const users = [];

//addUser, removeUser, getUser, getUsersInRoom

const addUser = ({id,username,room}) => {
    //clean data
    username = username.trim().toLowerCase();   //take off empty spaces and convert to lowercase
    room = room.trim().toLowerCase();

    //validate data
    if(!username || !room)
    {
        return {
            error: 'Username and room are required'
        }
    }

    //check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    });

    //validate username
    if(existingUser)
    {
        return {
            error: 'username already exists'
        }
    }

    //store user
    const user = {id, username,room};
    users.push(user);
    return {user};
}

const removeUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id;
    });

    if(index !== -1)
    {
        return users.splice(index, 1)[0];   //splice returns an array, so remove the only object in that array -> [0]
    }
}

const getUser = (id) => {
    const index = users.findIndex((user) => {
        return user.id === id;
    });

    if(index !== -1)
    {
        return users[index];
    }
}

const getUsersInRoom = (room) => {
    const usersInRoom = users.filter((user) => {
        return user.room === room;
    });

    return usersInRoom;
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}