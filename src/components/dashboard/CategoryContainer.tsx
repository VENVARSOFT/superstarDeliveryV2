import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import React, {FC, useEffect, useMemo, useState} from 'react';
import ScalePress from '@components/ui/ScalePress';
import {navigate} from '@utils/NavigationUtils';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {
  getProductCategories,
  TransformedCategory,
} from '@service/productService';

const CategoryContainer: FC<{data?: any[]}> = ({data}) => {
  const [apiCategories, setApiCategories] = useState<TransformedCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (data && data.length) {
      return; // use provided data if present
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await getProductCategories();
        if (response?.success && Array.isArray(response.data)) {
          const transformed: TransformedCategory[] = response.data.map(
            category => ({
              _id: category.idProductCategory,
              id: category.idProductCategory,
              name: category.txCategoryName,
              image: category.txImageUrl,
              slug: category.txSlug,
              description: category.txDescription,
              longDescription: category.txLongDescription,
              thumbnailUrl: category.txThumbnailUrl,
              isActive: category.flActive,
            }),
          );
          setApiCategories(transformed);
        } else {
          setApiCategories([]);
        }
      } catch (error) {
        setApiCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [data]);

  const itemsToRender = useMemo(() => {
    return (data && data.length ? data : apiCategories) || [];
  }, [data, apiCategories]);

  const getImageSource = (imageValue: any) => {
    if (!imageValue) {
      return undefined;
    }
    // If local require (number) or object already
    if (typeof imageValue === 'number' || typeof imageValue === 'object') {
      return imageValue;
    }
    // Assume string URL
    if (typeof imageValue === 'string') {
      return {uri: imageValue};
    }
    return undefined;
  };

  const renderItems = (items: any[]) => {
    return (
      <>
        {items?.map((item, index) => {
          return (
            <ScalePress
              key={index}
              style={styles.item}
              onPress={() => navigate('ProductCategories')}>
              <View style={styles.imageContainer}>
                {!!getImageSource(item?.image) && (
                  <Image
                    source={getImageSource(item?.image)}
                    style={styles.image}
                  />
                )}
              </View>
              <CustomText
                style={styles.text}
                variant="h10"
                fontFamily={Fonts.Medium}>
                {item?.name}
              </CustomText>
            </ScalePress>
          );
        })}
      </>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.border} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}>
          {renderItems(itemsToRender)}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  scrollContainer: {
    // paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  item: {
    width: 80,
    height: 100,
    marginRight: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  imageContainer: {
    width: 80,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    padding: 0,
    backgroundColor: '#E5F3F3',
    overflow: 'hidden',
    marginBottom: 6,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default CategoryContainer;
