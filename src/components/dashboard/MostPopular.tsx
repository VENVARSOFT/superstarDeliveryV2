import React, {FC, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, View} from 'react-native';
import {Colors} from '@utils/Constants';
import {Product} from '@service/productService';
import {getAllProducts} from '@service/productService';
import ProductItem from '@features/category/ProductItem';

const MostPopular: FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getAllProducts();
        if (response?.success && Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderItem = ({item, index}: {item: Product; index: number}) => (
    <ProductItem item={item} index={index} />
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={Colors.border} />
      </View>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={item => item.idProduct.toString()}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={{justifyContent: 'space-between'}}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    paddingVertical: 12,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 4,
  },
});

export default MostPopular;
