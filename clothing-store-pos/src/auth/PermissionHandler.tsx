import { usePermission } from './permissions';
import { Permission } from './permissions';

interface PermissionHandlerProps {
  permission: Permission;
  children: React.ReactNode;
}

const PermissionHandler: React.FC<PermissionHandlerProps> = ({ permission, children }) => {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return null;
  }

  return <>{children}</>;
};

export default PermissionHandler;
