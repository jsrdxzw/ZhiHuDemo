import React from 'react';
import {View, StyleSheet, Text, Image, TouchableOpacity} from 'react-native';
import {withNavigation} from 'react-navigation';
import {connect} from 'react-redux';

class ChatItem extends React.PureComponent {

    constructor(props) {
        super(props);
        this.state = {
            unReadCount: 0
        };
        this.gotoDetailChatView = this.gotoDetailChatView.bind(this);
    }

    gotoDetailChatView() {
        if(this.state.unReadCount){
            this.setState({
                unReadCount:0
            });
        }
        this.props.navigation.navigate('ChatDetailPage', {receiver: this.props.user})
    }

    componentWillReceiveProps(nextProps) {
        if ((nextProps.messages.messages && !nextProps.messages.currentChatter) || (nextProps.messages.messages && nextProps.messages.currentChatter !== this.props.user._id)) {

            if (nextProps.messages.messages.sender === this.props.user._id &&nextProps.messages.messages!==this.props.messages.messages) {
                this.setState((prevState, props) => ({
                    unReadCount: prevState.unReadCount + 1
                }));
            }
        }
    }

    render() {
        const {user} = this.props;
        return (
            <TouchableOpacity onPress={this.gotoDetailChatView} activeOpacity={1}>
                <View style={styles.container}>
                    <View style={styles.leftContainer}>
                        <Image style={styles.avatarStyle}
                               source={{uri: `data:image/png;base64,${user && user.avatar}`}}
                        />
                        <View style={styles.infoStyle}>
                            <Text>{user.name}</Text>
                            <Text style={styles.specialistsStyle}
                                  numberOfLines={2}>{user.speciality && user.speciality.join(',')}</Text>
                        </View>
                    </View>
                    {this.state.unReadCount ?
                        <View style={styles.circleContainer}>
                            <Text style={styles.circleTextStyle}>{this.state.unReadCount}</Text>
                        </View> : null
                    }
                    <Text style={styles.rightTextStyle}>{user.distance}</Text>
                </View>
            </TouchableOpacity>
        )
    }
}

const mapStateToProps = state => {
    return {
        messages: state.messages
    }
};

export default connect(mapStateToProps, null)(withNavigation(ChatItem))

const styles = StyleSheet.create({
    container: {
        padding: 8,
        backgroundColor: '#fff',
        borderTopColor: '#e8e8e8',
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    avatarStyle: {
        width: 36,
        height: 36,
        resizeMode: Image.resizeMode.contain
    },
    leftContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoStyle: {
        marginLeft: 10,
        marginRight: 50
    },
    rightTextStyle: {
        fontSize: 14,
        color: '#8c8c8c',
    },
    circleContainer: {
        backgroundColor: '#f5222d',
        minWidth: 16,
        padding: 2,
        alignItems: 'center',
        borderRadius: 4,
        marginRight: 10
    },
    circleTextStyle: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800'
    },
    specialistsStyle: {
        marginTop: 5,
        color: '#595959',
        fontSize: 12,
        lineHeight: 14
    }
});