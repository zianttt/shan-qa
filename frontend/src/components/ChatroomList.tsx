import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItem';
import type { Chatroom } from '../helpers/types';

interface ChatroomListProps {
    chatrooms: Chatroom[]
  }
  
const ChatroomList: React.FC<ChatroomListProps> = ({ chatrooms }) => {

    const handleChatroomClick = (chatroom: Chatroom) => {
        console.log(`Chatroom clicked: ${chatroom.name}`);
    }


  return (
    <List sx={{ width: '100%', maxWidth: 360, border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#fff' }}>
        {chatrooms.map((chatroom) => (
            <ListItemButton 
                key={chatroom.id} 
                sx={{ width: '100%', justifyContent: 'space-between', cursor: 'pointer', backgroundColor: '#f0f0f0', marginBottom: '5px' }} 
                onClick={() => handleChatroomClick(chatroom)}>
                {chatroom.name}
            </ListItemButton>
        ))}
    </List>
  )
}

export default ChatroomList