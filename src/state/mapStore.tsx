import {useDispatch, useSelector} from 'react-redux';
import type {RootState} from './store';
import {setMapRef as setMapRefAction} from './mapSlice';

interface MapRefStore {
  mapRef: any;
  setMapRef: (ref: any) => void;
}

export const useMapRefStore = (): MapRefStore => {
  const dispatch = useDispatch();
  const mapRef = useSelector((state: RootState) => state.map.mapRef);
  return {
    mapRef,
    setMapRef: (ref: any) => dispatch(setMapRefAction(ref)),
  };
};
