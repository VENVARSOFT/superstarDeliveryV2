import {View, StyleSheet, Pressable} from 'react-native';
import React, {FC} from 'react';
import {useCartStore} from '@state/cartStore';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import {addToCart, removeFromCart, updateCart} from '@service/cartService';

const UniversalAdd: FC<{item: any}> = ({item}) => {
  const {getItemCount, addItem, removeItem} = useCartStore();

  const productId: number = (item?.idProduct ??
    item?._id ??
    item?.id) as number;
  const count = getItemCount(productId);

  const handleAdd = async () => {
    try {
      if (count === 0) {
        await addToCart(productId, 1);
      } else {
        await updateCart(productId, count + 1);
      }
      addItem({...item, _id: productId});
    } catch (e) {
      // no-op for now; could add toast/alert
    }
  };

  const handleMinus = async () => {
    try {
      if (count - 1 <= 0) {
        await removeFromCart(productId);
      } else {
        await updateCart(productId, count - 1);
      }
      removeItem(productId);
    } catch (e) {
      // no-op for now; could add toast/alert
    }
  };

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: count === 0 ? '#fff' : Colors.secondary},
      ]}>
      {count === 0 ? (
        <Pressable onPress={handleAdd} style={styles.add}>
          <CustomText
            variant="h9"
            fontFamily={Fonts.SemiBold}
            style={styles.addText}>
            ADD
          </CustomText>
        </Pressable>
      ) : (
        <View style={styles.counterContainer}>
          <Pressable onPress={handleMinus}>
            <Icon name="minus" color="#fff" size={RFValue(13)} />
          </Pressable>
          <CustomText
            fontFamily={Fonts.SemiBold}
            style={styles.text}
            variant="h8">
            {count}
          </CustomText>
          <Pressable onPress={handleAdd}>
            <Icon name="plus" color="#fff" size={RFValue(13)} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.secondary,
    width: 65,
    borderRadius: 8,
  },
  add: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  addText: {
    color: Colors.secondary,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  text: {
    color: '#fff',
  },
});
export default UniversalAdd;
