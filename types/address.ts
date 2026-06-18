import type { PsgcAddressSelection } from "@/lib/psgcAddress";

export interface ShippingAddressForm extends PsgcAddressSelection {
  line1: string;
  zipCode: string;
  country: string;
  landmark: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
