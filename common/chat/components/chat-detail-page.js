import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    Platform
} from 'react-native';
import ChatFooter from "./chat-footer";
import KeyboardSpacer from 'react-native-keyboard-spacer';
import Icon from 'react-native-vector-icons/Ionicons';
import {connect} from 'react-redux';
import MessageItem from "./message-item";
import {read_special_message, set_current_chater, clear_chatter} from '../actions';
import {getMyHistoryMessage, sendMyMessage} from "../../utils/rest";
import {set_cache_messages, get_cache_messages, receiver_timely_message} from '../../utils/cache';
import moment from "moment/moment";

class ChatPage extends React.Component {

    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
        return {
            title: params.receiver.name,
            headerRight:
                <TouchableOpacity onPress={params.gotoDetailUser&&params.gotoDetailUser}>
                    <Icon
                        name={'ios-person'}
                        size={26}
                        style={{color: '#000', marginRight: 10, paddingTop: 2}}
                    />
                </TouchableOpacity>,
        }
    };

    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            messages: [],
            count: 0
        };
        this.loadingMore = false;
        this.sendMessage = this.sendMessage.bind(this);
        this.refresh = this.refresh.bind(this);
        this.focusInput = this.focusInput.bind(this);
        this.gotoDetailUser = this.gotoDetailUser.bind(this);
        this.props.navigation.setParams({gotoDetailUser:this.gotoDetailUser});
        this.chatUser = this.props.navigation.state.params.receiver;
    }

    componentWillMount() {
        this.props.navigation.setParams({receiver: this.chatUser})
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.messages && nextProps.messages !== this.props.messages && nextProps.messages.sender === this.chatUser._id) {
            this.loadingMore = false;
            let newMessage = nextProps.messages;
            const created_at = nextProps.messages.created_at;
            const messages = this.state.messages;
            if (messages.length) {
                const diff = moment(created_at).diff(moment(messages[messages.length - 1].created_at), 'minutes');
                if (diff >= 5 && diff < 60 * 24) {
                    newMessage = {...newMessage, time: moment(created_at).format('a h:mm')};
                } else if (diff >= 60 * 24) {
                    newMessage = {...newMessage, time: moment(created_at).format('lll')};
                }
            }
            if (this._isMounted) {
                this.setState((prevState, props) => ({
                    count: prevState.count + 1,
                    messages: [...prevState.messages, newMessage]
                }));
                receiver_timely_message(this.chatUser._id, newMessage)
            }
            this.props.read_special_message();
        }
    }

    gotoDetailUser(){
        this.props.navigation.navigate('otherUserPage',{user:this.chatUser})
    }


    componentDidMount() {
        this.loadingMore = false;
        this._isMounted = true;
        this.props.set_current_chater(this.chatUser._id);
        if (get_cache_messages(this.chatUser._id)) {
            const {cacheMessage, cacheMessageCount} = get_cache_messages(this.chatUser._id);
            this.setState({
                messages: cacheMessage,
                count: cacheMessageCount
            })
        } else {
            this.loadMoreMessage(true);
        }
    }

    componentDidUpdate() {
        if (!this.loadingMore) {
            this._flatList.scrollToEnd()
        }
    }

    /** 2018/1/17
     * author: XU ZHI WEI
     * function:表示我发了一个消息
     */
    sendMessage(content) {
        const sender = this.props.user._id;
        const created_at = new Date();
        const messages = this.state.messages;
        let sendMessage = {content, sender: sender, created_at};
        if (messages.length) {
            const diff = moment(created_at).diff(moment(messages[messages.length - 1].created_at), 'minutes');
            if (diff >= 5 && diff < 60 * 24) {
                sendMessage = {...sendMessage, time: moment(created_at).format('a h:mm')};
            } else if (diff >= 60 * 24) {
                sendMessage = {...sendMessage, time: moment(created_at).format('lll')};
            }
        }
        if (this._isMounted) {
            this.setState({
                count: this.state.count + 1,
                messages: [...this.state.messages, sendMessage]
            });
            receiver_timely_message(this.chatUser._id, sendMessage);
        }
        sendMyMessage(content, sender, this.chatUser._id).then(() => {}).catch(err => {
        })
    }

    /** 2018/1/18
     * author: XU ZHI WEI
     * function: 加载历史数据
     */
    refresh() {
        this.loadingMore = true;
        this.loadMoreMessage();
    }

    focusInput() {
        this.loadingMore = false;
        this._flatList.scrollToEnd();
    }

    loadMoreMessage(firstLoad = false) {
        const sender = this.chatUser._id;
        const receiver = this.props.user._id;
        const count = this.state.count;
        const loadLength = this.state.messages.length;
        if (count > loadLength || loadLength === 0) {
            getMyHistoryMessage(sender, receiver, loadLength)
                .then(({count, data}) => {
                    if (this._isMounted && count) {
                        this.setState({
                            count,
                            messages: [...data, ...this.state.messages],
                            loading: false
                        });
                        if (firstLoad) {
                            set_cache_messages(sender, data, count)
                        }
                    }
                }).catch(err => {
                if (this._isMounted) {
                    this.setState({
                        loading: false
                    });
                }
            })
        }
    }

    render() {
        return (
            <View style={styles.container}>
                <FlatList
                    ref={(flatList) => this._flatList = flatList}
                    onRefresh={this.refresh}
                    refreshing={this.state.loading}
                    data={this.state.messages}
                    keyExtractor={(item, index) => item._id || index}
                    renderItem={({item}) => <MessageItem message={item} chatUser={this.chatUser} user={this.props.user}/>}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}><Text>没有任何消息</Text></View>
                    }
                    ListHeaderComponent={
                        <View style={styles.headerContainer}/>
                    }
                />
                <ChatFooter sendMessage={this.sendMessage} focusInput={this.focusInput}/>
                {Platform.OS === 'ios' ? <KeyboardSpacer/> : null}
            </View>
        );
    }

    componentWillUnmount() {
        this.props.clear_chatter();
        this._isMounted = false
    }

}

const mapStateToProps = (state) => {
    // const sender = ownProps.navigation.state.params.receiver._id;
    return {
        user: state.user,
        messages: state.messages.messages,
        // cacheMessages:state.messages.cacheMessages[sender],
        // cacheMessagesCount:state.messages.cacheMessagesCount[sender]
    }
};

const mapStateFromProps = dispatch => {
    return {
        read_special_message: () => dispatch(read_special_message()),
        set_current_chater: (chatter_id) => dispatch(set_current_chater(chatter_id)),
        clear_chatter: () => dispatch(clear_chatter()),
        // set_cache_messages:(sender,messages,count)=>dispatch(set_cache_messages(sender,messages,count))
    }
};

export default connect(mapStateToProps, mapStateFromProps)(ChatPage)

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#91A0D5',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5
    },
    headerContainer: {
        padding: 7,
    }
});